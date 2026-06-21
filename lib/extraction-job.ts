import type { ExtractionJob, ExtractionJobStatus } from "@prisma/client";
import { prisma } from "./prisma";
import {
  extractGroupContacts,
  extractPersonalContacts,
  type ExtractedContact,
} from "./whatsapp";

// ─── In-memory job registry (survives across requests within same server process) ───

interface JobState {
  jobId: string;
  status: ExtractionJobStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  cancelRequested: boolean;
  abortController: AbortController | null;
}

const activeJobs = new Map<string, JobState>();

// ─── Types ───

export interface StartExtractionInput {
  enrichProfiles: boolean;
  groupIds?: string[];
  includePersonalContacts?: boolean;
}

export interface JobStatusResponse {
  id: string;
  type: string;
  status: ExtractionJobStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  enrichProfiles: boolean;
  result: unknown;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ─── Helpers ───

function toResponse(job: ExtractionJob): JobStatusResponse {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    totalItems: job.totalItems,
    processedItems: job.processedItems,
    enrichProfiles: job.enrichProfiles,
    result: job.result,
    error: job.error,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

export async function getJobFromDB(
  jobId: string,
): Promise<JobStatusResponse | null> {
  const job = await prisma.extractionJob.findUnique({ where: { id: jobId } });
  return job ? toResponse(job) : null;
}

export async function listRecentJobs(limit = 10): Promise<JobStatusResponse[]> {
  const jobs = await prisma.extractionJob.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return jobs.map(toResponse);
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const state = activeJobs.get(jobId);
  if (state) {
    state.cancelRequested = true;
    state.abortController?.abort();
  }
  await prisma.extractionJob.update({
    where: { id: jobId },
    data: {
      status: "cancelled",
      completedAt: new Date(),
    },
  });
  activeJobs.delete(jobId);
  return true;
}

// ─── Core: start an async extraction job ───

export async function startExtractionJob(
  input: StartExtractionInput,
): Promise<{ jobId: string }> {
  const job = await prisma.extractionJob.create({
    data: {
      type: "contacts",
      status: "pending",
      enrichProfiles: input.enrichProfiles,
      groupIds: input.groupIds ?? [],
    },
  });
  // Note: enrichProfiles is kept for backward compat but enrichment is now
  // handled by a separate cron job (runContactEnrichmentJob). Extraction itself
  // only fetches names + phone numbers and upserts them — lightning fast.

  const state: JobState = {
    jobId: job.id,
    status: "pending",
    progress: 0,
    totalItems: 0,
    processedItems: 0,
    cancelRequested: false,
    abortController: new AbortController(),
  };
  activeJobs.set(job.id, state);

  // Fire-and-forget — runs in background within the server process
  runExtractionJob(job.id, input, state).catch((err) => {
    console.error(`[extraction-job ${job.id}] Unhandled error:`, err);
  });

  // Safety timeout: if the job hasn't completed in 5 minutes, mark it as failed
  setTimeout(
    async () => {
      const current = await prisma.extractionJob.findUnique({
        where: { id: job.id },
      });
      if (
        current &&
        (current.status === "pending" || current.status === "running")
      ) {
        console.error(`[extraction-job ${job.id}] Timed out after 5 minutes`);
        state.cancelRequested = true;
        state.abortController?.abort();
        await prisma.extractionJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            error: "Job timed out after 5 minutes",
            completedAt: new Date(),
          },
        });
        activeJobs.delete(job.id);
      }
    },
    5 * 60 * 1000,
  );

  return { jobId: job.id };
}

// ─── The actual extraction worker ───

async function runExtractionJob(
  jobId: string,
  input: StartExtractionInput,
  state: JobState,
): Promise<void> {
  const signal = state.abortController?.signal;

  try {
    // Mark as running
    await prisma.extractionJob.update({
      where: { id: jobId },
      data: { status: "running", startedAt: new Date() },
    });
    state.status = "running";

    // ── Phase 1: Extract contacts from WhatsApp groups + personal chats ──
    const groupResult = await extractGroupContacts(input.groupIds);
    if (groupResult === null) {
      throw new Error("WhatsApp not connected");
    }

    const { contacts: groupContacts, groupsScanned } = groupResult;

    // Also fetch personal (1:1) contacts if requested
    let personalContacts: ExtractedContact[] = [];
    if (input.includePersonalContacts) {
      const personalResult = await extractPersonalContacts();
      if (personalResult) {
        personalContacts = personalResult.contacts;
      }
    }

    // Merge & deduplicate by phone number (group contacts take priority for source)
    const seenPhones = new Set<string>();
    const contacts: ExtractedContact[] = [];
    for (const c of groupContacts) {
      if (!seenPhones.has(c.phoneNumber)) {
        seenPhones.add(c.phoneNumber);
        contacts.push(c);
      }
    }
    for (const c of personalContacts) {
      if (!seenPhones.has(c.phoneNumber)) {
        seenPhones.add(c.phoneNumber);
        contacts.push(c);
      }
    }

    const totalSteps = contacts.length;

    await prisma.extractionJob.update({
      where: { id: jobId },
      data: { totalItems: totalSteps },
    });
    state.totalItems = totalSteps;

    if (contacts.length === 0) {
      await prisma.extractionJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          progress: 100,
          completedAt: new Date(),
          result: {
            totalExtracted: 0,
            newContacts: 0,
            updatedContacts: 0,
            enrichedProfiles: 0,
            groupsScanned,
            personalContacts: personalContacts.length,
          },
        },
      });
      activeJobs.delete(jobId);
      return;
    }

    let newCount = 0;
    let updatedCount = 0;
    let processed = 0;

    // ── Phase 2: Upsert contacts into DB (batched) — this is the only heavy step now ──
    const UPSERT_BATCH = 25;
    for (let i = 0; i < contacts.length; i += UPSERT_BATCH) {
      if (state.cancelRequested || signal?.aborted) {
        await markCancelled(jobId);
        return;
      }

      const batch = contacts.slice(i, i + UPSERT_BATCH);
      await Promise.all(
        batch.map(async (contact: ExtractedContact) => {
          const existing = await prisma.userLead.findUnique({
            where: { phoneNumber: contact.phoneNumber },
          });

          if (existing) {
            const updateData: Record<string, unknown> = {
              pushName: contact.pushName || existing.pushName,
              isGroupAdmin: contact.isAdmin || existing.isGroupAdmin,
              lastSeenAt: new Date(),
            };

            if (
              existing.source !== "manual_entry" &&
              existing.source !== "booking_guest"
            ) {
              updateData.source = "group_member";
              updateData.sourceGroupId = contact.sourceGroupId;
              updateData.sourceGroupName = contact.sourceGroupName;
            }

            await prisma.userLead.update({
              where: { id: existing.id },
              data: updateData,
            });
            updatedCount++;
          } else {
            await prisma.userLead.create({
              data: {
                phoneNumber: contact.phoneNumber,
                name: contact.name,
                pushName: contact.pushName,
                source:
                  contact.source === "personal_chat"
                    ? "personal_chat"
                    : "group_member",
                sourceGroupId: contact.sourceGroupId,
                sourceGroupName: contact.sourceGroupName,
                isGroupAdmin: contact.isAdmin,
                isWhatsAppUser: true,
              },
            });
            newCount++;
          }
          processed++;
        }),
      );

      state.processedItems = processed;
      const pct = Math.round((processed / totalSteps) * 100);
      state.progress = pct;

      await prisma.extractionJob.update({
        where: { id: jobId },
        data: { processedItems: processed, progress: pct },
      });
    }

    // ── Phase 3: Mark completed (enrichment is now handled by a separate cron) ──
    const finalResult = {
      totalExtracted: contacts.length,
      newContacts: newCount,
      updatedContacts: updatedCount,
      enrichedProfiles: 0,
      groupsScanned,
      personalContacts: personalContacts.length,
    };

    await prisma.extractionJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        progress: 100,
        processedItems: totalSteps,
        completedAt: new Date(),
        result: finalResult,
      },
    });

    state.status = "completed";
    state.progress = 100;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await prisma.extractionJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error: errorMsg,
        completedAt: new Date(),
      },
    });
    state.status = "failed";
    console.error(`[extraction-job ${jobId}] Failed:`, errorMsg);
  } finally {
    // Keep the state in memory for a short while so polling can see 100%
    // but clean up after 30s
    setTimeout(() => activeJobs.delete(jobId), 30_000);
  }
}

// ─── Utils ───

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function markCancelled(jobId: string): Promise<void> {
  await prisma.extractionJob.update({
    where: { id: jobId },
    data: { status: "cancelled", completedAt: new Date() },
  });
  activeJobs.delete(jobId);
}

// ─── Stale job recovery: on server start, mark any orphaned "running" jobs as failed ───

export async function recoverStaleJobs(): Promise<void> {
  const stale = await prisma.extractionJob.findMany({
    where: { status: { in: ["pending", "running"] } },
  });

  for (const job of stale) {
    await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        error: "Server restarted while job was in progress",
        completedAt: new Date(),
      },
    });
  }

  if (stale.length > 0) {
    console.log(`[extraction-job] Recovered ${stale.length} stale jobs`);
  }
}

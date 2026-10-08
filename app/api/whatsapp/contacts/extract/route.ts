import { listRecentJobs, startExtractionJob } from "@/lib/extraction-job";
import { toErrorResponse } from "@/lib/http-error";
import { extractContactsSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    return await handlePOST(request);
  } catch (err) {
    return toErrorResponse(err, "POST /api/whatsapp/contacts/extract");
  }
}

async function handlePOST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = extractContactsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        ),
      },
      { status: 400 },
    );
  }

  const { enrichProfiles, groupIds, includePersonalContacts } = parsed.data;

  const { jobId } = await startExtractionJob({
    enrichProfiles,
    groupIds,
    includePersonalContacts,
  });

  return NextResponse.json({
    success: true,
    jobId,
    message:
      "Extraction started. Poll GET /api/whatsapp/contacts/extract/[jobId] for status.",
  });
}

export async function GET() {
  try {
    return await handleGET();
  } catch (err) {
    return toErrorResponse(err, "GET /api/whatsapp/contacts/extract");
  }
}

async function handleGET() {
  const jobs = await listRecentJobs(10);
  return NextResponse.json({ jobs });
}

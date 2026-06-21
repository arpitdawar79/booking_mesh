import { listRecentJobs, startExtractionJob } from "@/lib/extraction-job";
import { extractContactsSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
  const jobs = await listRecentJobs(10);
  return NextResponse.json({ jobs });
}

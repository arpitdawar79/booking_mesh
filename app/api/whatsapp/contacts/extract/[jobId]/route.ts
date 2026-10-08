import { cancelJob, getJobFromDB } from "@/lib/extraction-job";
import { toErrorResponse } from "@/lib/http-error";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    return await handleGET(_request, { params });
  } catch (err) {
    return toErrorResponse(err, "GET /api/whatsapp/contacts/extract/[jobId]");
  }
}

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = await getJobFromDB(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    return await handleDELETE(_request, { params });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/whatsapp/contacts/extract/[jobId]");
  }
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = await getJobFromDB(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return NextResponse.json({ error: "Job already finished" }, { status: 400 });
  }

  await cancelJob(jobId);
  return NextResponse.json({ success: true, message: "Job cancelled" });
}

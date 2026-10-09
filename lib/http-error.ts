import { logger } from "@/lib/logger";
import type { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// HttpError → JSON response with its status; anything else → logged + opaque 500.
// next/server is loaded lazily so non-Next entrypoints (cron jobs) can import this module.
export async function toErrorResponse(
  err: unknown,
  context?: string,
): Promise<NextResponse> {
  const { NextResponse } = await import("next/server");
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  logger.error(
    "api",
    `Unhandled error${context ? ` in ${context}` : ""}: ${err instanceof Error ? err.message : String(err)}`,
    { stack: err instanceof Error ? err.stack : undefined },
  );
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

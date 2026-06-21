export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { recoverStaleJobs } = await import("@/lib/extraction-job");
    recoverStaleJobs().catch((err) => {
      console.error("[instrumentation] Failed to recover stale jobs:", err);
    });
  }
}

import { runSheetSync } from "../lib/sheet-sync/sync";

async function main() {
  const dryRun = process.argv.includes("--dry");
  const report = await runSheetSync({
    dryRun,
    log: (l, m) => console.log(`[${l}] ${m}`),
  });
  console.log("\n=== report ===");
  for (const s of report.streams) {
    console.log(
      `${s.stream}: scanned=${s.scanned} created=${s.created} updated=${s.updated} unchanged=${s.unchanged} legacy=${s.legacy} incomplete=${s.incomplete} complete=${s.complete} softGaps=${s.softGaps} deleted=${s.deleted} drift=${s.driftSuspected}`,
    );
  }
  if (report.errors.length) console.log("errors:", report.errors);
  process.exit(0);
}
void main();

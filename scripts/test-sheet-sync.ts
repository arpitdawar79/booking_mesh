/**
 * Dev check: parses the local "Ekantah Master Sheet.xlsx" through the
 * sheet-sync pipeline (no Drive, no DB) and prints what the judge sees.
 *
 * Run: pnpm tsx scripts/test-sheet-sync.ts
 */
import { SHEET_STREAMS } from "../lib/sheet-sync/config";
import { matricesFromLocalXlsx } from "../lib/sheet-sync/google";
import { judgeRow, parseStream } from "../lib/sheet-sync/parse";

const FILE =
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ??
  "Ekantah Master Sheet.xlsx";
const BASE_YEAR = 2025;
const WITH_DB = process.argv.includes("--db");

async function main() {
  const tabNames = [...new Set(SHEET_STREAMS.map((stream) => stream.tabName))];
  const matrices = await matricesFromLocalXlsx(FILE, tabNames);

  if (WITH_DB) {
    const { runSheetSync } = await import("../lib/sheet-sync/sync");
    const report = await runSheetSync({
      tabFetcher: async (tabName) => {
        const matrix = matrices.get(tabName);
        if (!matrix) throw new Error(`Missing tab ${tabName}`);
        return matrix;
      },
      log: (label, message) => console.log(`[${label}] ${message}`),
    });
    console.log("\n=== DB sync report ===");
    console.log(JSON.stringify(report.streams, null, 2));
    return;
  }

  for (const stream of SHEET_STREAMS) {
    const matrix = matrices.get(stream.tabName) ?? [];
    const rows = parseStream(stream, matrix, BASE_YEAR);
    let incomplete = 0;
    let soft = 0;
    let clean = 0;
    let unparsed = 0;
    const incompleteSample: string[] = [];
    const unparsedSample: string[] = [];

    for (const row of rows) {
      const judgement = judgeRow(
        stream,
        row.fields,
        null,
        row.parsedDate,
      );
      if (row.dateUnparsed) {
        unparsed++;
        if (unparsedSample.length < 5) {
          unparsedSample.push(
            `#${row.rowId} ${stream.dateField}="${row.fields[stream.dateField ?? ""]}"`,
          );
        }
      }
      if (judgement.missingRequired.length) {
        incomplete++;
        if (incompleteSample.length < 5) {
          incompleteSample.push(
            `#${row.rowId} row${row.rowNum} missing=[${judgement.missingRequired.join(",")}] ` +
              `→ ${JSON.stringify(row.fields).slice(0, 140)}`,
          );
        }
      } else if (judgement.missingSoft.length) {
        soft++;
      } else {
        clean++;
      }
    }

    console.log(`\n=== ${stream.key} (${stream.tabName}) ===`);
    console.log(
      `rows=${rows.length} required-missing=${incomplete} soft-only=${soft} clean=${clean} unparsed-dates=${unparsed}`,
    );
    for (const sample of incompleteSample) console.log(`  INC  ${sample}`);
    for (const sample of unparsedSample) console.log(`  DATE ${sample}`);

    const dates = rows
      .map((row) => row.parsedDate)
      .filter(Boolean) as Date[];
    if (dates.length) {
      dates.sort((left, right) => left.getTime() - right.getTime());
      console.log(
        `  date range: ${dates[0].toISOString().slice(0, 10)} → ${dates[dates.length - 1].toISOString().slice(0, 10)}`,
      );
    }
  }
}

void main().finally(() => process.exit(0));

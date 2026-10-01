import { fetchTabs, getFileMeta } from "../lib/sheet-sync/google";
import { SHEET_STREAMS } from "../lib/sheet-sync/config";

async function main() {
  const meta = await getFileMeta(process.env.SHEET_FILE_ID!);
  console.log("file:", meta.name, "| mime:", meta.mimeType, "| modified:", meta.modifiedTime);
  const tabs = [...new Set(SHEET_STREAMS.map((s) => s.tabName))];
  const matrices = await fetchTabs(meta, tabs);
  for (const tab of tabs) {
    const matrix = matrices.get(tab) ?? [];
    console.log(
      `tab "${tab}": ${matrix.length} rows x ${Math.max(0, ...matrix.map((row) => row.length))} cols`,
    );
  }
  process.exit(0);
}
void main();

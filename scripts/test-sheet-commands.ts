/** Dev check: exercises handleSheetCommand against the DB with a mock reply. */
import { handleSheetCommand } from "../lib/sheet-sync/commands";

const reply = async (m: string) => console.log(`BOT> ${m}\n`);

async function main() {
  for (const msg of process.argv.slice(2)) {
    console.log(`USER> ${msg}`);
    await handleSheetCommand(reply, msg);
  }
  process.exit(0);
}
void main();

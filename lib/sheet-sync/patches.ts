import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { SheetRow } from "@prisma/client";
import { APP_CONFIG_KEYS, SHEET_STREAMS } from "./config";
import { parseSheetDate } from "./dates";
import {
  applyFieldsToLinkedRecord,
  linkOrCreateLedgerRecord,
} from "./ledger";
import { effectiveFields, judgeRow } from "./parse";

export type PatchSource = "form" | "whatsapp" | "dashboard";

const streamDef = (key: string) =>
  SHEET_STREAMS.find((s) => s.key === key);

/**
 * Merges app-side values into a SheetRow's patches, re-judges completeness,
 * and resolves the row when no required fields remain missing.
 * `values` keys must be canonical field keys (aliases resolved by callers).
 */
export async function applyRowPatches(
  row: SheetRow,
  values: Record<string, string>,
  source: PatchSource,
): Promise<{
  updated: string[];
  stillMissing: string[];
  stillMissingSoft: string[];
  rejectedStatus?: string;
}> {
  const def = streamDef(row.sheet);
  if (!def) return { updated: [], stillMissing: [], stillMissingSoft: [] };

  // Legacy/deleted rows are not editable — a patch here would resurrect or
  // import data that deliberately fell outside the cutoff.
  if (row.status === "legacy" || row.status === "deleted") {
    return {
      updated: [],
      stillMissing: row.missingRequired,
      stillMissingSoft: row.missingSoft,
      rejectedStatus: row.status,
    };
  }

  const patches = {
    ...((row.patches as Record<string, { value: string; source: string }>) ??
      {}),
  };
  const updated: string[] = [];

  for (const [key, value] of Object.entries(values)) {
    if (!def.fields.some((f) => f.key === key)) continue;
    if (!value.trim()) continue;
    patches[key] = { value: value.trim(), source };
    updated.push(key);
  }

  if (!updated.length) {
    const j = judgeRow(
      def,
      row.rawJson as Record<string, string>,
      patches,
      row.parsedDate,
    );
    return { updated, stillMissing: j.missingRequired, stillMissingSoft: j.missingSoft };
  }

  const effective = effectiveFields(
    row.rawJson as Record<string, string>,
    patches,
  );
  let parsedDate = row.parsedDate;
  if (def.dateField && updated.includes(def.dateField)) {
    const cutoff = await prisma.appConfig.findUnique({
      where: { key: APP_CONFIG_KEYS.syncFromDate },
    });
    const cutoffYear = cutoff?.value
      ? new Date(cutoff.value).getUTCFullYear()
      : new Date().getUTCFullYear();
    parsedDate = parseSheetDate(effective[def.dateField] ?? "", {
      year: cutoffYear,
      lastMonth: 0,
    });
  }
  const judged = judgeRow(
    def,
    row.rawJson as Record<string, string>,
    patches,
    parsedDate,
  );
  const done = judged.missingRequired.length === 0;

  await prisma.sheetRow.update({
    where: { id: row.id },
    data: {
      patches,
      parsedDate,
      missingRequired: judged.missingRequired,
      missingSoft: judged.missingSoft,
      status:
        done ? "resolved" : row.status === "skipped" ? "skipped" : "incomplete",
      ...(done
        ? {
            resolvedVia: source,
            resolvedAt: new Date(),
            snoozedUntil: null,
            conflictJson: Prisma.JsonNull,
            // A terminal classification (excluded_property etc.) from an
            // earlier attempt is retryable once the fields changed.
            ...(row.linkedRecordType && !row.linkedRecordId
              ? { linkedRecordType: null }
              : {}),
          }
        : {}),
    },
  });

  if (done) {
    const fresh = await prisma.sheetRow.findUnique({ where: { id: row.id } });
    if (fresh?.linkedRecordId) {
      await applyFieldsToLinkedRecord(fresh, updated);
    } else if (fresh) {
      await linkOrCreateLedgerRecord(fresh);
    }
  }

  return {
    updated,
    stillMissing: judged.missingRequired,
    stillMissingSoft: judged.missingSoft,
  };
}

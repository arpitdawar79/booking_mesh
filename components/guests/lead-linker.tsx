"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Panel,
  Notice,
  buttonClass,
  primaryClass,
  inputClass,
  guestApi,
} from "./ui";
interface Row {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status: string;
  guestIds?: string[];
  reason?: string;
}
interface Preview {
  results: Row[];
  remaining: number;
  totalPages: number;
}
export function LeadLinker({
  leadIds,
  onConverted,
}: {
  leadIds?: string[];
  onConverted?: () => void;
}) {
  const [data, setData] = useState<Preview | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  async function link(apply: boolean, nextPage = page) {
    setBusy(true);
    setError("");
    try {
      const d = await guestApi<Preview>("/api/guests/link-leads", {
        apply,
        search: leadIds ? "" : search,
        page: nextPage,
        leadIds: apply ? selected : leadIds,
      });
      setData(d);
      setPage(nextPage);
      setSelected([]);
      setDone(apply);
      if (apply) onConverted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not convert leads");
    } finally {
      setBusy(false);
    }
  }
  const eligible =
    data?.results
      .filter((r) => ["match", "new_profile"].includes(r.status))
      .map((r) => r.id) || [];
  return (
    <Panel title="Convert leads to guest profiles">
      <p className="mb-3 text-sm text-muted-foreground">
        Select leads to create profiles or link them to an existing guest. A
        profile without a stay is a prospect. Lead sources and opt-outs are
        preserved; conversion does not grant marketing consent.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          link(false, 1);
        }}
        className="flex flex-wrap gap-2"
      >
        {!leadIds && (
          <input
            aria-label="Search leads to convert"
            placeholder="Search lead name, phone or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass + " min-w-0 flex-1"}
            maxLength={120}
          />
        )}
        <button className={buttonClass} disabled={busy}>
          {busy ? "Preparing…" : "Preview lead conversion"}
        </button>
      </form>
      {data && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {data.remaining} leads remain unlinked
          </p>
          {eligible.length > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={eligible.every((id) => selected.includes(id))}
                onChange={(e) => setSelected(e.target.checked ? eligible : [])}
              />
              Select all eligible leads on this page
            </label>
          )}
          {!data.results.length && (
            <Notice message="No unconverted leads match this search." />
          )}
          {data.results.map((row) => (
            <div
              key={row.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <input
                aria-label={`Convert ${row.name}`}
                type="checkbox"
                className="mt-1"
                disabled={!eligible.includes(row.id) || busy}
                checked={selected.includes(row.id)}
                onChange={(e) =>
                  setSelected((p) =>
                    e.target.checked
                      ? [...p, row.id]
                      : p.filter((v) => v !== row.id),
                  )
                }
              />
              <div className="min-w-0 break-words">
                <p>
                  {row.name} · {row.phone}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.source?.replaceAll("_", " ")} ·{" "}
                  {row.status === "new_profile"
                    ? "Creates a new prospect profile"
                    : row.status === "match"
                      ? "Links to an existing guest"
                      : row.status.replaceAll("_", " ")}
                  {row.reason ? ` · ${row.reason}` : ""}
                </p>
                {row.guestIds?.map((id) => (
                  <Link
                    key={id}
                    href={`/dashboard/guests/${id}`}
                    className="mr-2 text-xs text-primary underline"
                  >
                    Open guest profile
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {!done && !leadIds && data.totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button
                className={buttonClass}
                disabled={busy || page <= 1}
                onClick={() => link(false, page - 1)}
              >
                Previous leads
              </button>
              <span className="text-xs">
                Page {page} of {data.totalPages}
              </span>
              <button
                className={buttonClass}
                disabled={busy || page >= data.totalPages}
                onClick={() => link(false, page + 1)}
              >
                Next leads
              </button>
            </div>
          )}
          {selected.length > 0 && (
            <button
              className={primaryClass}
              disabled={busy}
              onClick={() => link(true)}
            >
              Convert {selected.length} selected lead(s)
            </button>
          )}
        </div>
      )}
      {done && (
        <div className="mt-3">
          <Notice
            message={`Selected leads converted: ${data?.results.filter((r) => r.status === "linked" || r.status === "already_linked").length || 0} linked; ${data?.results.filter((r) => r.status === "conflict").length || 0} need review. Open their profiles above or find them in Guests.`}
          />
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Notice error message={error} />
        </div>
      )}
    </Panel>
  );
}

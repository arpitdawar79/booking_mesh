"use client";
import { useState } from "react";
import Link from "next/link";
import { Panel, Notice, inputClass, buttonClass, guestApi } from "./ui";
import type { GuestSummary } from "./types";
export function MergePanel({
  targetId,
  reload,
}: {
  targetId: string;
  reload: () => void;
}) {
  const [search, setSearch] = useState(""),
    [candidates, setCandidates] = useState<GuestSummary[]>([]),
    [source, setSource] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function find(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await guestApi<{ guests: GuestSummary[] }>(
        `/api/guests?search=${encodeURIComponent(search)}&pageSize=20`,
      );
      setCandidates(d.guests.filter((g) => g.id !== targetId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }
  async function merge() {
    setBusy(true);
    setError("");
    try {
      await guestApi("/api/guests/merge", { targetId, sourceId: source });
      setSource("");
      setCandidates([]);
      setReviewed(false);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not merge");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Resolve duplicate profiles">
      <p className="mb-3 text-sm text-muted-foreground">
        Move a duplicate’s stays and history into this profile. The original
        profile is retained with a redirect and an audit entry. Marketing
        consent uses the more restrictive setting.
      </p>
      <form onSubmit={find} className="flex flex-wrap gap-2">
        <input
          aria-label="Find duplicate guest"
          className={inputClass + " flex-1"}
          required
          minLength={2}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone or email"
        />
        <button className={buttonClass} disabled={busy}>
          Find profiles
        </button>
      </form>
      <div className="mt-3 space-y-2">
        {candidates.map((g) => (
          <label
            key={g.id}
            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"
          >
            <input
              type="radio"
              name="duplicate"
              checked={source === g.id}
              onChange={() => {
                setSource(g.id);
                setReviewed(false);
              }}
            />
            <span className="min-w-0 break-all">
              {g.name} · {g.phone || g.email} · {g.stats.totalStays} completed
              stays{" "}
              <Link
                href={`/dashboard/guests/${g.id}`}
                target="_blank"
                className="text-primary underline"
              >
                Review profile ↗
              </Link>
            </span>
          </label>
        ))}
      </div>
      {source && (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I reviewed both profiles and they belong to the same guest
          </label>
          <button
            disabled={busy || !reviewed}
            className={buttonClass}
            onClick={merge}
          >
            {busy ? "Merging…" : "Merge into this profile"}
          </button>
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

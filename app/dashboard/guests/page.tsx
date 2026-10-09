"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, Plus, Settings, ArrowUpRight } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import {
  applyDateRangeParams,
  type DateRangeSelection,
} from "@/lib/date-range";
import { LeadLinker } from "@/components/guests/lead-linker";
import { ProfileForm } from "@/components/guests/profile-form";
import { CampaignDraft } from "@/components/guests/campaign-draft";
import {
  Badge,
  Notice,
  Loading,
  buttonClass,
  primaryClass,
  inputClass,
  money,
  date,
} from "@/components/guests/ui";
import type { GuestSummary } from "@/components/guests/types";
interface Directory {
  guests: GuestSummary[];
  total: number;
  totalPages: number;
  overview: {
    guests: number;
    returning: number;
    repeatRate: number;
    netRevenue: number;
    rewardPoints: number;
    comeback: number;
    openFeedback: number;
  };
  canManage: boolean;
}
const filters = [
  ["all", "All guests"],
  ["returning", "Returning"],
  ["first_time", "First stay"],
  ["win_back", "Win-back"],
  ["service_recovery", "Follow-up"],
  ["birthday", "Birthdays"],
  ["rewards", "With rewards"],
  ["upcoming", "Upcoming"],
  ["prospect", "Prospects"],
  ["expiring_rewards", "Expiring rewards"],
  ["profile_incomplete", "Profile gaps"],
  ["ready_to_contact", "Ready to contact"],
];
export default function GuestsPage() {
  const [data, setData] = useState<Directory | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [segment, setSegment] = useState("all"),
    [sort, setSort] = useState("updated"),
    [tier, setTier] = useState(""),
    [page, setPage] = useState(1),
    [range, setRange] = useState<DateRangeSelection>({ preset: "all" }),
    [adding, setAdding] = useState(false),
    [converting, setConverting] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [draft, setDraft] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      const p = new URLSearchParams({
        search,
        segment,
        tier,
        sort,
        page: String(page),
        pageSize: "20",
      });
      applyDateRangeParams(p, range);
      try {
        const r = await fetch(`/api/guests?${p}`, { signal });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [search, segment, tier, sort, page, range],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Users className="h-5 w-5 text-primary" />
            Guest relationships
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Remember every stay. Give guests a reason to return.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/guests/program" className={buttonClass}>
            <Settings className="h-4 w-4" />
            Program
          </Link>
          {data?.canManage && (
            <button
              className={buttonClass}
              onClick={() => setConverting((p) => !p)}
            >
              Convert leads
            </button>
          )}
          <button onClick={() => setAdding(true)} className={primaryClass}>
            <Plus className="h-4 w-4" />
            Add guest
          </button>
        </div>
      </div>
      {data && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Guests", data.overview.guests],
            [
              "Returning",
              `${data.overview.returning} · ${data.overview.repeatRate}%`,
            ],
            ["Net received (INR)", money(data.overview.netRevenue)],
            [
              "Available points",
              data.overview.rewardPoints.toLocaleString("en-IN"),
            ],
            ["Next actions", data.overview.comeback],
            ["Feedback follow-ups", data.overview.openFeedback],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 break-words text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}
      {converting && (
        <LeadLinker
          onConverted={() => {
            setPage(1);
            load();
          }}
        />
      )}
      {adding && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">New guest profile</h2>
          <ProfileForm
            onCancel={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              setPage(1);
              load();
            }}
          />
        </section>
      )}
      {draft && (
        <CampaignDraft guestIds={selected} onClose={() => setDraft(false)} />
      )}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="relative min-w-0 flex-1 sm:min-w-48">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            />
            <input
              aria-label="Search guests"
              placeholder="Search name, phone, city, preferences, tag or lead source"
              className={inputClass + " pl-10"}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Loyalty tier"
            className={inputClass + " sm:w-40"}
            value={tier}
            onChange={(e) => {
              setTier(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All tiers</option>
            {["Member", "Silver", "Gold", "Platinum"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="Sort guests"
            className={inputClass + " sm:w-44"}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="updated">Recently updated</option>
            <option value="priority">Action priority</option>
            <option value="value">Highest guest value</option>
            <option value="recent_stay">Most recent stay</option>
            <option value="points">Most reward points</option>
            <option value="name">Guest name</option>
          </select>
          <DateRangeFilter
            value={range}
            onChange={(v) => {
              setRange(v);
              setPage(1);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Search combines keywords across profile details, previous contacts and
          lead sources. Date filter applies to profile creation. Revenue uses
          recorded payments on completed stays, after refunds.
        </p>
        <div className="flex flex-wrap gap-2" aria-label="Guest segments">
          {filters.map(([value, label]) => (
            <button
              key={value}
              aria-pressed={segment === value}
              className={`${buttonClass} ${segment === value ? "border-primary bg-primary/10 text-primary" : ""}`}
              onClick={() => {
                setSegment(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {data?.canManage && selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3">
            <span className="text-sm">{selected.length} guest(s) selected</span>
            <button className={buttonClass} onClick={() => setDraft(true)}>
              Prepare campaign
            </button>
            <button
              className={buttonClass}
              onClick={() => {
                setSelected([]);
                setDraft(false);
              }}
            >
              Clear
            </button>
          </div>
        )}
        {error ? (
          <Notice message={error} error />
        ) : loading ? (
          <Loading />
        ) : !data?.guests.length ? (
          <Notice message="No guests match these filters. Add a profile or link historical stays from Program." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="hidden grid-cols-12 gap-3 border-b border-border bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground lg:grid">
              <span className="col-span-4">Guest</span>
              <span className="col-span-2">Stay history</span>
              <span className="col-span-2">Value & rewards</span>
              <span className="col-span-4">Next best action</span>
            </div>
            {data.guests.map((g) => (
              <div
                key={g.id}
                className="grid gap-3 border-b border-border p-4 last:border-0 lg:grid-cols-12"
              >
                <div className="flex min-w-0 gap-3 lg:col-span-4">
                  {data.canManage && (
                    <input
                      aria-label={`Select ${g.name} for campaign`}
                      type="checkbox"
                      className="mt-1.5 h-4 w-4 shrink-0"
                      checked={selected.includes(g.id)}
                      onChange={(e) => {
                        setDraft(false);
                        setSelected((p) =>
                          e.target.checked
                            ? [...p, g.id]
                            : p.filter((v) => v !== g.id),
                        );
                      }}
                    />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/guests/${g.id}`}
                      className="flex items-center gap-1 font-semibold hover:text-primary"
                    >
                      {g.name}
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {g.phone || g.email || "Contact details needed"}
                      {g.city ? ` · ${g.city}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge>{g.tier.name}</Badge>
                      {g.tags.slice(0, 2).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-sm lg:col-span-2">
                  <p>{g.stats.totalStays} completed stay(s)</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last: {date(g.stats.lastStay)}
                  </p>
                  {g.stats.upcomingStays > 0 && (
                    <p className="mt-1 text-xs text-primary">
                      {g.stats.upcomingStays} upcoming
                    </p>
                  )}
                </div>
                <div className="text-sm lg:col-span-2">
                  <p className="font-medium">{money(g.stats.netRevenue)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.wallet} points
                  </p>
                </div>
                <div className="lg:col-span-4">
                  {g.actions[0] ? (
                    <>
                      <Link
                        href={`/dashboard/guests/${g.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {g.actions[0].title} →
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {g.actions[0].reason}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {g.stats.upcomingStays
                        ? "Prepare for their next visit"
                        : "No action needed today"}
                    </p>
                  )}
                  {g.exclusionReason && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Marketing: {g.exclusionReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {data && (
          <Pagination
            page={page}
            totalPages={Math.max(1, data.totalPages)}
            total={data.total}
            onPageChange={setPage}
          />
        )}
      </section>
    </div>
  );
}

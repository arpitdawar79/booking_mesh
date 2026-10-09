"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Phone } from "lucide-react";
import { ProfileForm } from "@/components/guests/profile-form";
import { RewardsPanel } from "@/components/guests/rewards-panel";
import { ExperiencePanel } from "@/components/guests/experience-panel";
import { ReferralsPanel } from "@/components/guests/referrals-panel";
import { HistoryPanel } from "@/components/guests/history-panel";
import { MergePanel } from "@/components/guests/merge-panel";
import { CampaignDraft } from "@/components/guests/campaign-draft";
import {
  Panel,
  Badge,
  Notice,
  Loading,
  buttonClass,
  guestApi,
  money,
  date,
} from "@/components/guests/ui";
import type { Detail } from "@/components/guests/types";
export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter();
  const [data, setData] = useState<Detail | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [editing, setEditing] = useState(false),
    [tab, setTab] = useState("overview"),
    [draft, setDraft] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      const d = await guestApi<Detail>(
        `/api/guests?id=${encodeURIComponent(id)}`,
      );
      if (d.mergedIntoId) {
        router.replace(`/dashboard/guests/${d.mergedIntoId}`);
        return;
      }
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load guest");
    } finally {
      setLoading(false);
    }
  }, [id, router]);
  useEffect(() => {
    load();
  }, [load]);
  if (loading) return <Loading />;
  if (!data)
    return (
      <div className="space-y-3">
        <Link href="/dashboard/guests" className={buttonClass}>
          Back to guests
        </Link>
        <Notice error message={error || "Guest not found"} />
        <button className={buttonClass} onClick={load}>
          Retry
        </button>
      </div>
    );
  const g = data.guest;
  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/guests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Guest directory
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-2xl font-semibold">{g.name}</h1>
            <Badge>{data.tier.name}</Badge>
            {data.stats.totalStays > 1 && <Badge>Returning guest</Badge>}
          </div>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            {[g.phone, g.email, g.city].filter(Boolean).join(" · ") ||
              "Contact details needed"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {g.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
            {g.doNotContact && <Badge>Do not contact</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {g.phone && (
            <a className={buttonClass} href={`tel:${g.phone}`}>
              <Phone className="h-4 w-4" />
              Call
            </a>
          )}
          <button className={buttonClass} onClick={() => setEditing(!editing)}>
            <Pencil className="h-4 w-4" />
            {editing ? "Close edit" : "Edit profile"}
          </button>
        </div>
      </div>
      {error && <Notice error message={error} />}
      {editing && (
        <Panel title="Edit guest profile">
          <ProfileForm
            guest={g}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              load();
            }}
          />
        </Panel>
      )}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        {[
          ["Completed stays", data.stats.totalStays],
          ["Net received (INR)", money(data.stats.netRevenue)],
          ["Nights stayed", data.stats.totalNights],
          ["Available points", data.wallet],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 break-words text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {draft !== null && (
        <CampaignDraft
          guestIds={[g.id]}
          initialMessage={draft}
          onClose={() => setDraft(null)}
        />
      )}
      <nav
        className="flex flex-wrap gap-2 border-b border-border pb-3"
        aria-label="Guest profile sections"
      >
        {[
          ["overview", "Overview"],
          ["rewards", "Loyalty & benefits"],
          ["referrals", "Referrals"],
          ["experience", "Feedback & reviews"],
          ["history", "Stays & timeline"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-current={tab === value ? "page" : undefined}
            className={`${buttonClass} ${tab === value ? "border-primary bg-primary/10 text-primary" : ""}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Panel title="Next best actions">
              {data.actions.length ? (
                <div className="space-y-4">
                  {data.actions.map((a) => (
                    <div
                      key={a.kind}
                      className="rounded-lg border border-border p-3"
                    >
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {a.reason}
                      </p>
                      {a.marketing && data.canManage ? (
                        <button
                          className={buttonClass + " mt-3"}
                          disabled={!data.marketingEligible}
                          onClick={() => setDraft(a.message)}
                        >
                          Prepare message
                        </button>
                      ) : !a.marketing ? (
                        <button
                          className={buttonClass + " mt-3"}
                          onClick={() => setTab("experience")}
                        >
                          Review feedback
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No action needed today. Recommendations use actual stay
                  history, rewards, birthdays and feedback.
                </p>
              )}
              {data.exclusionReason && (
                <p className="mt-3 text-xs text-muted-foreground">
                  WhatsApp marketing: {data.exclusionReason}
                </p>
              )}
            </Panel>
            <Panel title="Stay preferences">
              <p className="whitespace-pre-wrap text-sm">
                {g.preferences || "No preferences recorded yet."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Most booked room:{" "}
                {data.stats.preferredRoomType || "Not enough history"}
              </p>
            </Panel>
            <Panel title="Internal notes">
              <p className="whitespace-pre-wrap text-sm">
                {g.notes || "No internal notes."}
              </p>
            </Panel>
          </div>
          <div className="space-y-5 lg:col-span-2">
            <Panel title="Guest details">
              <dl className="space-y-3 text-sm">
                {[
                  ["Last completed stay", date(data.stats.lastStay)],
                  ["First stay", date(data.stats.firstStay)],
                  ["Average stay", `${data.stats.avgStayLength} nights`],
                  ["Upcoming reservations", data.stats.upcomingStays],
                  ["Birthday", date(g.birthday)],
                  ["Address", g.address || "—"],
                  [
                    "Identity document",
                    g.idType ? `${g.idType} · ${g.idNumber || "—"}` : "—",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
              {data.stats.otherCurrencies.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Other stay currencies: {data.stats.otherCurrencies.join(", ")}
                  . INR figures exclude them.
                </p>
              )}
            </Panel>
            <Panel title="Communication preferences">
              <div className="space-y-2 text-sm">
                <p>
                  WhatsApp marketing:{" "}
                  {g.whatsappConsent ? "Agreed" : "No consent"}
                </p>
                <p>
                  Email marketing: {g.emailConsent ? "Agreed" : "No consent"}
                </p>
                <p>Contact suppression: {g.doNotContact ? "Active" : "None"}</p>
              </div>
              <button
                className={buttonClass + " mt-3"}
                onClick={() => setTab("experience")}
              >
                Prepare preferences link
              </button>
            </Panel>
            <Panel title="Known contact aliases">
              {g.contacts.length ? (
                g.contacts.map((c) => (
                  <p key={c.id} className="mb-2 break-all text-xs">
                    <span className="text-muted-foreground">{c.kind}: </span>
                    {c.value}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aliases are added when this profile is linked or updated.
                </p>
              )}
            </Panel>
          </div>
        </div>
      )}
      {tab === "rewards" && <RewardsPanel data={data} reload={load} />}
      {tab === "referrals" && <ReferralsPanel data={data} reload={load} />}
      {tab === "experience" && (
        <ExperiencePanel data={data} reload={load} onDraft={setDraft} />
      )}
      {tab === "history" && (
        <>
          <HistoryPanel data={data} />
          {data.canManage && <MergePanel targetId={g.id} reload={load} />}
        </>
      )}
    </div>
  );
}

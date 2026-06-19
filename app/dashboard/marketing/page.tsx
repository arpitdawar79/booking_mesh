"use client";

import { MagicCard } from "@/components/ui/magic-card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Megaphone,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Tag,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface LeadStats {
  total: number;
  active: number;
  optedOut: number;
  bySource: { source: string; count: number }[];
  topGroups: { name: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

interface Lead {
  id: string;
  phoneNumber: string;
  name: string | null;
  pushName: string | null;
  source: string;
  sourceGroupName: string | null;
  isGroupAdmin: boolean;
  isWhatsAppUser: boolean;
  tags: string[];
  status: string;
  aboutText: string | null;
  profilePicUrl: string | null;
  lastEnrichedAt: string | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  messageBody: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  completedAt: string | null;
  template?: { name: string } | null;
}

interface Template {
  id: string;
  name: string;
  body: string;
  category: string;
  variables: string[];
}

type Tab = "overview" | "leads" | "campaigns" | "templates";

export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/whatsapp/contacts/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (leadSearch) params.set("search", leadSearch);
    if (leadSource) params.set("source", leadSource);
    params.set("page", String(leadsPage));
    params.set("limit", "50");
    const res = await fetch(`/api/whatsapp/contacts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads);
      setLeadsTotal(data.pagination.total);
    }
  }, [leadSearch, leadSource, leadsPage]);

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch("/api/marketing/campaigns?limit=50");
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/marketing/templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchLeads(), fetchCampaigns(), fetchTemplates()])
      .finally(() => setLoading(false));
  }, [fetchStats, fetchLeads, fetchCampaigns, fetchTemplates]);

  const handleExtract = async () => {
    setExtracting(true);
    setExtractResult(null);
    try {
      const res = await fetch("/api/whatsapp/contacts/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrichProfiles: true }),
      });
      const data = await res.json();
      if (res.ok) {
        const s = data.stats;
        setExtractResult(
          `Extracted ${s.totalExtracted} contacts from ${s.groupsScanned} groups. ${s.newContacts} new, ${s.updatedContacts} updated, ${s.enrichedProfiles} profiles enriched.`,
        );
        fetchStats();
        fetchLeads();
      } else {
        setExtractResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setExtractResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setExtracting(false);
  };

  const handleSendCampaign = async (campaignId: string, dryRun: boolean) => {
    if (!dryRun && !confirm("Send this campaign to all recipients? This cannot be undone.")) return;
    setSendingCampaign(campaignId);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, dryRun }),
      });
      const data = await res.json();
      if (res.ok) {
        if (dryRun) {
          alert(`Dry run: ${data.totalRecipients} recipients would receive this message.`);
        } else {
          alert(`Campaign sent! ${data.stats.sent} sent, ${data.stats.failed} failed.`);
          fetchCampaigns();
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setSendingCampaign(null);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/marketing/campaigns/${campaignId}`, { method: "DELETE" });
    fetchCampaigns();
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/marketing/templates/${templateId}`, { method: "DELETE" });
    fetchTemplates();
  };

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "overview", label: "Overview", icon: Megaphone },
    { key: "leads", label: "Leads", icon: Users },
    { key: "campaigns", label: "Campaigns", icon: Send },
    { key: "templates", label: "Templates", icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Marketing
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1 font-medium">
              WhatsApp contact extraction, campaigns & broadcast messaging.
            </p>
          </div>
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition disabled:opacity-50"
          >
            {extracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {extracting ? "Extracting..." : "Extract Contacts"}
          </button>
        </div>
      </motion.div>

      {extractResult && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs font-medium"
        >
          {extractResult}
        </motion.div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/30 w-fit overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition",
                tab === t.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="marketingTabBg"
                  className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/15 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.key === "leads" && stats && (
                <span className="ml-0.5 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">
                  {stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MagicCard className="p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{stats?.total || 0}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Total Leads</div>
                </div>
              </div>
            </MagicCard>
            <MagicCard className="p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{stats?.active || 0}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Active</div>
                </div>
              </div>
            </MagicCard>
            <MagicCard className="p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{campaigns.length}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Campaigns</div>
                </div>
              </div>
            </MagicCard>
            <MagicCard className="p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{templates.length}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Templates</div>
                </div>
              </div>
            </MagicCard>
          </div>

          {/* Source Breakdown */}
          {stats && stats.bySource.length > 0 && (
            <MagicCard className="p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2.5">
                Leads by Source
              </h3>
              <div className="space-y-1.5">
                {stats.bySource.map((s) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <span className="font-medium capitalize">{s.source.replace(/_/g, " ")}</span>
                    <span className="font-bold text-primary">{s.count}</span>
                  </div>
                ))}
              </div>
            </MagicCard>
          )}

          {/* Top Groups */}
          {stats && stats.topGroups.length > 0 && (
            <MagicCard className="p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2.5">
                Top Groups
              </h3>
              <div className="space-y-1.5">
                {stats.topGroups.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate max-w-[70%]">{g.name}</span>
                    <span className="font-bold text-muted-foreground">{g.count} contacts</span>
                  </div>
                ))}
              </div>
            </MagicCard>
          )}

          {/* Top Tags */}
          {stats && stats.topTags.length > 0 && (
            <MagicCard className="p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2.5">
                Top Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {stats.topTags.map((t) => (
                  <span
                    key={t.tag}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/15 text-[10px] font-bold text-primary"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {t.tag}
                    <span className="text-primary/60">{t.count}</span>
                  </span>
                ))}
              </div>
            </MagicCard>
          )}
        </motion.div>
      )}

      {/* Leads Tab */}
      {tab === "leads" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Search & Filter */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, phone, group..."
                value={leadSearch}
                onChange={(e) => {
                  setLeadSearch(e.target.value);
                  setLeadsPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30 transition"
              />
            </div>
            <select
              value={leadSource}
              onChange={(e) => {
                setLeadSource(e.target.value);
                setLeadsPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30 transition"
            >
              <option value="">All Sources</option>
              <option value="group_member">Group Member</option>
              <option value="personal_chat">Personal Chat</option>
              <option value="manual_entry">Manual Entry</option>
              <option value="booking_guest">Booking Guest</option>
            </select>
          </div>

          <div className="text-[10px] text-muted-foreground font-medium">
            {leadsTotal} total leads
          </div>

          {/* Leads List */}
          <div className="space-y-1.5">
            {leads.length === 0 ? (
              <MagicCard className="p-6 text-center">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium">
                  No leads found. Extract contacts from WhatsApp to get started.
                </p>
              </MagicCard>
            ) : (
              leads.map((lead) => (
                <MagicCard key={lead.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {(lead.name || lead.pushName || lead.phoneNumber)?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">
                          {lead.name || lead.pushName || "Unknown"}
                        </div>
                        <div className="text-[10px] text-muted-foreground/70 font-medium flex items-center gap-1.5">
                          <Phone className="w-2.5 h-2.5" />
                          {lead.phoneNumber}
                          {lead.isGroupAdmin && (
                            <span className="text-amber-600 font-bold">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {lead.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold",
                          lead.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : lead.status === "opted_out"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-rose-500/10 text-rose-600",
                        )}
                      >
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  {lead.sourceGroupName && (
                    <div className="text-[10px] text-muted-foreground/50 mt-1.5 font-medium">
                      From: {lead.sourceGroupName}
                    </div>
                  )}
                </MagicCard>
              ))
            )}
          </div>

          {/* Pagination */}
          {leadsTotal > 50 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                disabled={leadsPage === 1}
                className="px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-bold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                Page {leadsPage}
              </span>
              <button
                onClick={() => setLeadsPage((p) => p + 1)}
                disabled={leads.length < 50}
                className="px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Campaigns
            </h2>
            <button
              onClick={() => setShowCampaignForm(!showCampaignForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </button>
          </div>

          {showCampaignForm && (
            <CampaignForm
              templates={templates}
              onClose={() => setShowCampaignForm(false)}
              onCreated={() => {
                fetchCampaigns();
                setShowCampaignForm(false);
              }}
            />
          )}

          {campaigns.length === 0 ? (
            <MagicCard className="p-6 text-center">
              <Megaphone className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">
                No campaigns yet. Create one to start broadcasting.
              </p>
            </MagicCard>
          ) : (
            campaigns.map((c) => (
              <MagicCard key={c.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm truncate">{c.name}</h3>
                      <CampaignStatusBadge status={c.status} />
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 font-medium line-clamp-2 mb-2">
                      {c.messageBody}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                      <span>{c.totalRecipients} recipients</span>
                      {c.sentCount > 0 && (
                        <span className="text-emerald-600">{c.sentCount} sent</span>
                      )}
                      {c.failedCount > 0 && (
                        <span className="text-rose-600">{c.failedCount} failed</span>
                      )}
                      {c.template && (
                        <span className="text-primary">Template: {c.template.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.status === "draft" && (
                      <>
                        <button
                          onClick={() => handleSendCampaign(c.id, true)}
                          disabled={sendingCampaign === c.id}
                          className="p-1.5 rounded-lg hover:bg-muted/50 transition"
                          title="Dry run"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleSendCampaign(c.id, false)}
                          disabled={sendingCampaign === c.id}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition"
                          title="Send campaign"
                        >
                          {sendingCampaign === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </div>
              </MagicCard>
            ))
          )}
        </motion.div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Message Templates
            </h2>
            <button
              onClick={() => setShowTemplateForm(!showTemplateForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Template
            </button>
          </div>

          {showTemplateForm && (
            <TemplateForm
              onClose={() => setShowTemplateForm(false)}
              onCreated={() => {
                fetchTemplates();
                setShowTemplateForm(false);
              }}
            />
          )}

          {templates.length === 0 ? (
            <MagicCard className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">
                No templates yet. Create reusable message templates.
              </p>
            </MagicCard>
          ) : (
            templates.map((t) => (
              <MagicCard key={t.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{t.name}</h3>
                      <span className="px-1.5 py-0.5 rounded bg-muted/40 text-[9px] font-bold text-muted-foreground">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 font-medium line-clamp-3">
                      {t.body}
                    </p>
                    {t.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {t.variables.map((v) => (
                          <span
                            key={v}
                            className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </MagicCard>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-muted/40 text-muted-foreground",
    scheduled: "bg-indigo-500/10 text-indigo-600",
    sending: "bg-amber-500/10 text-amber-600",
    completed: "bg-emerald-500/10 text-emerald-600",
    paused: "bg-amber-500/10 text-amber-600",
    cancelled: "bg-rose-500/10 text-rose-600",
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold capitalize", styles[status] || styles.draft)}>
      {status}
    </span>
  );
}

function CampaignForm({
  templates,
  onClose,
  onCreated,
}: {
  templates: Template[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [excludeOptedOut, setExcludeOptedOut] = useState(true);
  const [targetSources, setTargetSources] = useState<string[]>([]);
  const [targetTags, setTargetTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sources = ["group_member", "personal_chat", "broadcast_list", "manual_entry", "booking_guest"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          messageBody,
          templateId: templateId || null,
          excludeOptedOut,
          targetSources,
          targetTags,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated();
      } else {
        setError(data.error || "Failed to create campaign");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setSaving(false);
  };

  return (
    <MagicCard className="p-4 space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Message Body</label>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            required
            rows={4}
            placeholder="Use {{name}} for personalization"
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30 resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Template (optional)</label>
          <select
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              const t = templates.find((t) => t.id === e.target.value);
              if (t) {
                setName(name || t.name);
                setMessageBody(t.body);
              }
            }}
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30"
          >
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Target Sources</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {sources.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setTargetSources((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                  );
                }}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-bold transition border",
                  targetSources.includes(s)
                    ? "bg-primary/15 border-primary/25 text-primary"
                    : "bg-muted/20 border-border/20 text-muted-foreground",
                )}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Target Tags (comma-separated)</label>
          <input
            type="text"
            value={targetTags.join(", ")}
            onChange={(e) => setTargetTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={excludeOptedOut}
            onChange={(e) => setExcludeOptedOut(e.target.checked)}
            className="rounded"
          />
          Exclude opted-out contacts
        </label>

        {error && <p className="text-[10px] text-rose-600 font-medium">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Campaign"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      </form>
    </MagicCard>
  );
}

function TemplateForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [variables, setVariables] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          body,
          category,
          variables: variables.split(",").map((v) => v.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated();
      } else {
        setError(data.error || "Failed to create template");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setSaving(false);
  };

  return (
    <MagicCard className="p-4 space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Template Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            placeholder="Use {{name}} for personalization"
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30 resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground/80">Variables (comma-separated)</label>
          <input
            type="text"
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            placeholder="name, date, amount"
            className="w-full mt-1 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-medium focus:outline-none focus:border-primary/30"
          />
        </div>
        {error && <p className="text-[10px] text-rose-600 font-medium">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Template"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      </form>
    </MagicCard>
  );
}

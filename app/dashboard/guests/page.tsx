"use client";

import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { MagicCard } from "@/components/ui/magic-card";
import { PlusCircle, Search, User, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  idType: string | null;
  idNumber: string | null;
  address: string | null;
  preferences: string | null;
  createdAt: string;
  _count: { bookings: number };
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const pageSize = 20;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    idType: "",
    idNumber: "",
    address: "",
    preferences: "",
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/guests?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setGuests(data.guests || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          Guests
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests..."
              className="pl-10 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring w-40 sm:w-56"
            />
          </div>
          <button
            onClick={() => {
              setFormData({
                name: "",
                phone: "",
                email: "",
                idType: "",
                idNumber: "",
                address: "",
                preferences: "",
              });
              setShowForm(true);
            }}
            className="rounded-lg bg-foreground text-background px-4 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Guest
          </button>
        </div>
      </div>

      {showForm && (
        <MagicCard className="w-full">
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Add Guest</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-md hover:bg-muted transition"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                const res = await fetch("/api/guests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...formData,
                    phone: formData.phone || undefined,
                    email: formData.email || undefined,
                    idType: formData.idType || undefined,
                    idNumber: formData.idNumber || undefined,
                    address: formData.address || undefined,
                    preferences: formData.preferences || undefined,
                  }),
                });
                setSaving(false);
                if (res.ok) {
                  setShowForm(false);
                  setPage(1);
                  const params = new URLSearchParams();
                  params.set("page", String(1));
                  params.set("pageSize", String(pageSize));
                  if (search.trim()) params.set("search", search.trim());
                  fetch(`/api/guests?${params}`)
                    .then((r) => r.json())
                    .then((data) => {
                      setGuests(data.guests || []);
                      setTotal(data.total || 0);
                    });
                } else {
                  alert("Failed to add guest.");
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
            <div>
              <label className="block text-xs font-medium mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">ID Type</label>
              <input
                value={formData.idType}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, idType: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                ID Number
              </label>
              <input
                value={formData.idNumber}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, idNumber: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Address</label>
              <input
                value={formData.address}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Preferences
              </label>
              <input
                value={formData.preferences}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, preferences: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition"
              >
                {saving ? "Saving..." : "Save Guest"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </MagicCard>
      )}

      {loading && guests.length === 0 ? (
        <div className="text-muted-foreground">Loading guests...</div>
      ) : guests.length === 0 ? (
        <div className="rounded-xl border border-border p-6 sm:p-8 text-center text-muted-foreground">
          No guests found.
        </div>
      ) : (
        <>
          {/* Mobile cards with MagicCard wrapper */}
          <div className="lg:hidden space-y-2.5">
            {guests.map((g) => (
              <MagicCard key={g.id}>
                <Link
                  href={`/dashboard/guests/${g.id}`}
                  className="block p-3.5 space-y-2 relative z-10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-teal-400" />
                      </div>
                      <div>
                        <div className="font-bold text-sm leading-none">{g.name}</div>
                        <div className="text-xs text-muted-foreground/75 mt-1 font-medium">
                          {g.phone || g.email || "No contact info"}
                        </div>
                      </div>
                    </div>
                    <StatusBadge
                      status={g._count.bookings > 1 ? "confirmed" : "pending"}
                      className="!text-[9px] !px-1.5 !py-0.5"
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 font-semibold uppercase tracking-wider pl-9">
                    {g._count.bookings} booking{g._count.bookings !== 1 ? "s" : ""}
                  </div>
                </Link>
              </MagicCard>
            ))}
          </div>

          {/* Desktop table with MagicCard wrapper */}
          <div className="hidden lg:block">
            <MagicCard className="overflow-visible">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-left">Phone</th>
                      <th className="text-left">Email</th>
                      <th className="text-left">Bookings</th>
                      <th className="text-left">ID Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((g) => (
                      <tr key={g.id}>
                        <td className="font-semibold text-xs">
                          <Link
                            href={`/dashboard/guests/${g.id}`}
                            className="hover:text-teal-400 transition"
                          >
                            {g.name}
                          </Link>
                        </td>
                        <td className="text-muted-foreground/80">{g.phone || "—"}</td>
                        <td className="text-muted-foreground/80">{g.email || "—"}</td>
                        <td className="font-medium">{g._count.bookings}</td>
                        <td className="text-muted-foreground/85 text-xs">{g.idType || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MagicCard>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

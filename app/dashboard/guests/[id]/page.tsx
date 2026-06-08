"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import {
    ArrowLeft,
    IndianRupee,
    MapPin,
    Moon,
    Pencil,
    Phone,
    Save,
    User,
    X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface GuestDetail {
  guest: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    idType: string | null;
    idNumber: string | null;
    address: string | null;
    preferences: string | null;
    createdAt: string;
  };
  stats: {
    totalRevenue: number;
    totalNights: number;
    avgStayLength: number;
    preferredRoomType: string | null;
    totalStays: number;
  };
  bookings: Array<{
    id: string;
    bookingId: string;
    checkInDate: string | Date;
    checkOutDate: string | Date;
    nightCount: number;
    roomType: string;
    totalAmount: number;
    status: string;
    payments: Array<{ amount: number; method: string; date: string | Date }>;
  }>;
}

function fmtDate(d: string | Date): string {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  return d.toISOString().split("T")[0];
}

export default function GuestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<GuestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    fetch(`/api/guests?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="text-muted-foreground">Loading guest...</div>;
  if (!data)
    return <div className="text-muted-foreground">Guest not found.</div>;

  const { guest, stats, bookings } = data;
  const isReturning = stats.totalStays > 1;

  function startEditing() {
    setEditForm({
      name: guest.name,
      phone: guest.phone || "",
      email: guest.email || "",
      idType: guest.idType || "",
      idNumber: guest.idNumber || "",
      address: guest.address || "",
      preferences: guest.preferences || "",
    });
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: guest.id,
        name: editForm.name,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        idType: editForm.idType || undefined,
        idNumber: editForm.idNumber || undefined,
        address: editForm.address || undefined,
        preferences: editForm.preferences || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      fetch(`/api/guests?id=${id}`)
        .then((r) => r.json())
        .then((d) => setData(d));
    } else {
      alert("Failed to update guest.");
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/guests"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to guests
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {guest.name}
              {isReturning && (
                <span className="rounded-full bg-blue-900/30 text-blue-300 px-2 py-0.5 text-[10px] font-medium">
                  Returning Guest
                </span>
              )}
            </h1>
            <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
              {guest.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  {guest.phone}
                </div>
              )}
              {guest.email && <div>{guest.email}</div>}
              {guest.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {guest.address}
                </div>
              )}
            </div>
          </div>
        </div>
        {!editing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-xs rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={handleSaveEdit}
          className="rounded-xl border border-border p-4 sm:p-6 space-y-4 bg-muted/10"
        >
          <h2 className="text-sm font-semibold">Edit Guest</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">ID Type</label>
              <input
                value={editForm.idType}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, idType: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                ID Number
              </label>
              <input
                value={editForm.idNumber}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, idNumber: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Address</label>
              <input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, address: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Preferences
              </label>
              <input
                value={editForm.preferences}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, preferences: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
        />
        <StatCard
          icon={<Moon className="w-5 h-5 text-blue-400" />}
          label="Total Nights"
          value={stats.totalNights}
        />
        <StatCard
          icon={<User className="w-5 h-5 text-amber-400" />}
          label="Stays"
          value={stats.totalStays}
        />
        <StatCard
          icon={<User className="w-5 h-5 text-purple-400" />}
          label="Avg Stay"
          value={`${stats.avgStayLength} nights`}
        />
      </div>

      {guest.preferences && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Preferences
          </h3>
          <p className="text-sm">{guest.preferences}</p>
        </div>
      )}

      {/* Booking History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Booking History</h2>
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
            No bookings found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">
                    Booking ID
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Dates</th>
                  <th className="text-left px-4 py-3 font-medium">Nights</th>
                  <th className="text-left px-4 py-3 font-medium">Room</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/dashboard/booking/${b.id}`}
                        className="hover:text-teal-400 transition"
                      >
                        #{b.bookingId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(b.checkInDate)} → {fmtDate(b.checkOutDate)}
                    </td>
                    <td className="px-4 py-3">{b.nightCount}</td>
                    <td className="px-4 py-3">{b.roomType}</td>
                    <td className="px-4 py-3">
                      ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {b.payments.length} payment
                      {b.payments.length !== 1 ? "s" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

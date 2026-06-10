"use client";

import { Pagination } from "@/components/ui/pagination";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import {
    CalendarDays,
    ClipboardList,
    IndianRupee,
    Pencil,
    PlusCircle,
    Search,
    ShoppingCart,
    Trash2,
    X,
    Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AdditionalSale {
  id: string;
  date: string | Date;
  guestName: string;
  saleType: string;
  guestType: string;
  amount: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
}

function fmtDate(d: string | Date): string {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  return d.toISOString().split("T")[0];
}

function fmtCurrency(n: number): string {
  return `\u20b9${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtLabel(key: string): string {
  return key.replace(/_/g, " ");
}

const SALE_TYPE_OPTIONS = [
  { value: "restaurant", label: "Restaurant" },
  { value: "activity", label: "Activity" },
  { value: "stay", label: "Stay" },
];

const GUEST_TYPE_OPTIONS = [
  { value: "outsider", label: "Outsider" },
  { value: "hotel_guest", label: "Hotel Guest" },
];

const PAYMENT_OPTIONS = ["cash", "upi"];

export default function AdditionalSalesPage() {
  const { success, error } = useToast();
  const [sales, setSales] = useState<AdditionalSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl+S");
  const pageSize = 20;

  useEffect(() => {
    setShortcutLabel(navigator.platform.includes("Mac") ? "⌘S" : "Ctrl+S");
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (month) params.set("month", month);

    fetch(`/api/additional-sales?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSales(data.sales || []);
        setTotal(data.total || 0);
        setTotalAmount(data.summary?.totalAmount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search, month]);

  useEffect(() => {
    setPage(1);
  }, [search, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add") {
      setSlideOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setEditingId(null);
        setSlideOpen(true);
      }
      if (e.key === "Escape" && slideOpen) {
        setSlideOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slideOpen]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this sale entry?")) return;
    const res = await fetch(`/api/additional-sales?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      success("Sale deleted");
      setSales((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    } else {
      error("Failed to delete sale");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function openAdd() {
    setEditingId(null);
    setSlideOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setSlideOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-400" />
          Additional Sale Ledger
        </h1>
        <button
          onClick={openAdd}
          className="rounded-lg bg-foreground text-background px-4 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1 self-start"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Sale
          <span className="hidden sm:inline ml-1 text-[10px] opacity-70">
            {shortcutLabel}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sales..."
            className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring w-40 sm:w-56"
          />
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {(search || month) && (
          <button
            onClick={() => {
              setSearch("");
              setMonth("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<ClipboardList className="w-5 h-5 text-teal-400" />}
          label="Total Entries"
          value={total}
        />
        <SummaryCard
          icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
          label="Total Amount"
          value={fmtCurrency(totalAmount)}
        />
        <SummaryCard
          icon={<CalendarDays className="w-5 h-5 text-blue-400" />}
          label="Period"
          value={month || "All time"}
        />
      </div>

      <SlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        title={editingId ? "Edit Sale" : "Add Sale"}
      >
        <SaleForm
          editingId={editingId}
          onSaved={() => {
            setSlideOpen(false);
            setEditingId(null);
            setPage(1);
            loadData();
          }}
          onClose={() => setSlideOpen(false)}
        />
      </SlideOver>

      {loading && sales.length === 0 ? (
        <div className="text-muted-foreground">Loading sales...</div>
      ) : sales.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          No sales found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Guest</th>
                  <th className="text-left px-4 py-3 font-medium">Sale Type</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Guest Type
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Method</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(s.date)}
                    </td>
                    <td className="px-4 py-3">{s.guestName}</td>
                    <td className="px-4 py-3 capitalize">
                      {fmtLabel(s.saleType)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {fmtLabel(s.guestType)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {fmtCurrency(Number(s.amount))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground uppercase">
                      {s.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(s.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function SummaryCard({
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
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function SaleForm({
  editingId,
  onSaved,
  onClose,
}: {
  editingId: string | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    date: new Date().toISOString().split("T")[0],
    guestName: "",
    saleType: "restaurant",
    guestType: "outsider",
    amount: "",
    paymentMethod: "cash",
    notes: "",
  });

  useEffect(() => {
    if (editingId) {
      fetch(`/api/additional-sales?id=${editingId}`)
        .then((r) => r.json())
        .then((data) => {
          const s = data.sale;
          if (s) {
            setFormData({
              date: fmtDate(s.date),
              guestName: s.guestName,
              saleType: s.saleType,
              guestType: s.guestType,
              amount: String(s.amount),
              paymentMethod: s.paymentMethod,
              notes: s.notes || "",
            });
          }
        });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        guestName: "",
        saleType: "restaurant",
        guestType: "outsider",
        amount: "",
        paymentMethod: "cash",
        notes: "",
      });
    }
  }, [editingId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(
        "sale-guest",
      ) as HTMLInputElement | null;
      el?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [editingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, unknown> = {
      date: formData.date,
      guestName: formData.guestName,
      saleType: formData.saleType,
      guestType: formData.guestType,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined,
    };

    if (editingId) payload.id = editingId;

    const res = await fetch("/api/additional-sales", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      success(editingId ? "Sale updated" : "Sale added");
      onSaved();
    } else {
      error("Failed to save sale");
    }
  }

  const update = (key: string, value: string) =>
    setFormData((p) => ({ ...p, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => update("date", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Guest Name <span className="text-red-400">*</span>
          </label>
          <input
            id="sale-guest"
            type="text"
            required
            value={formData.guestName}
            onChange={(e) => update("guestName", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Who is this for?"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Sale Type <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={formData.saleType}
            onChange={(e) => update("saleType", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SALE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Guest Type <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={formData.guestType}
            onChange={(e) => update("guestType", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {GUEST_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Amount <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            required
            min={0}
            step="0.01"
            value={formData.amount}
            onChange={(e) => update("amount", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Payment Method
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => update("paymentMethod", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PAYMENT_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Notes</label>
        <input
          type="text"
          value={formData.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Optional notes..."
        />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition"
        >
          <Zap className="w-3.5 h-3.5" />
          {saving ? "Saving..." : editingId ? "Update" : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

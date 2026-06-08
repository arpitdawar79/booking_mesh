"use client";

import { Pagination } from "@/components/ui/pagination";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface RestaurantSale {
  id: string;
  date: string | Date;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  recordedBy: string | null;
  notes: string | null;
  createdAt: string;
}

function fmtDate(d: string | Date): string {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  return d.toISOString().split("T")[0];
}

function fmtCurrency(n: number): string {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RestaurantSalesPage() {
  const [sales, setSales] = useState<RestaurantSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    setPage(1);
  }, [search, month]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (month) params.set("month", month);

    fetch(`/api/restaurant-sales?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSales(data.sales || []);
        setTotal(data.total || 0);
        setTotalAmount(data.summary?.totalAmount || 0);
        setTotalQuantity(data.summary?.totalQuantity || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, pageSize, search, month]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this sale entry?")) return;
    const res = await fetch(`/api/restaurant-sales?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSales((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-400" />
          Restaurant Sale Ledger
        </h1>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-foreground text-background px-4 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1 self-start"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Sale
        </button>
      </div>

      {/* Filters */}
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard icon={<ClipboardList className="w-5 h-5 text-teal-400" />} label="Total Entries" value={total} />
        <SummaryCard icon={<IndianRupee className="w-5 h-5 text-emerald-400" />} label="Total Revenue" value={fmtCurrency(totalAmount)} />
        <SummaryCard icon={<CalendarDays className="w-5 h-5 text-blue-400" />} label="Period" value={month || "All time"} />
      </div>

      {showForm && (
        <SaleForm
          editingId={editingId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setEditingId(null);
            setPage(1);
            const params = new URLSearchParams();
            params.set("page", String(1));
            params.set("pageSize", String(pageSize));
            if (search.trim()) params.set("search", search.trim());
            if (month) params.set("month", month);
            fetch(`/api/restaurant-sales?${params}`)
              .then((r) => r.json())
              .then((data) => {
                setSales(data.sales || []);
                setTotal(data.total || 0);
                setTotalAmount(data.summary?.totalAmount || 0);
                setTotalQuantity(data.summary?.totalQuantity || 0);
              });
          }}
        />
      )}

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
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-left px-4 py-3 font-medium">Qty</th>
                  <th className="text-left px-4 py-3 font-medium">Unit Price</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Method</th>
                  <th className="text-left px-4 py-3 font-medium">Recorded By</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.date)}</td>
                    <td className="px-4 py-3">{s.itemName}</td>
                    <td className="px-4 py-3">{s.quantity}</td>
                    <td className="px-4 py-3">{fmtCurrency(Number(s.unitPrice))}</td>
                    <td className="px-4 py-3 font-medium">{fmtCurrency(Number(s.totalAmount))}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{s.paymentMethod.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.recordedBy || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setShowForm(true);
                          }}
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
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function SaleForm({ editingId, onClose, onSaved }: { editingId: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    date: new Date().toISOString().split("T")[0],
    itemName: "",
    quantity: "1",
    unitPrice: "",
    totalAmount: "",
    paymentMethod: "cash",
    recordedBy: "",
    notes: "",
  });

  useEffect(() => {
    if (editingId) {
      fetch(`/api/restaurant-sales?id=${editingId}`)
        .then((r) => r.json())
        .then((data) => {
          const s = data.sale;
          if (s) {
            setFormData({
              date: fmtDate(s.date),
              itemName: s.itemName,
              quantity: String(s.quantity),
              unitPrice: String(s.unitPrice),
              totalAmount: String(s.totalAmount),
              paymentMethod: s.paymentMethod,
              recordedBy: s.recordedBy || "",
              notes: s.notes || "",
            });
          }
        });
    }
  }, [editingId]);

  // Auto-compute totalAmount
  const computedTotal = (Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const total = computedTotal;

    const payload: Record<string, unknown> = {
      date: formData.date,
      itemName: formData.itemName,
      quantity: Number(formData.quantity),
      unitPrice: Number(formData.unitPrice),
      totalAmount: total,
      paymentMethod: formData.paymentMethod,
      recordedBy: formData.recordedBy || undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      payload.id = editingId;
    }

    const res = await fetch("/api/restaurant-sales", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      alert("Failed to save sale.");
    }
  }

  return (
    <div className="rounded-xl border border-border p-4 sm:p-6 space-y-4 bg-muted/10">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{editingId ? "Edit Sale" : "Add Sale"}</h2>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Date <span className="text-red-400">*</span></label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Item Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={formData.itemName}
            onChange={(e) => setFormData((p) => ({ ...p, itemName: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Quantity <span className="text-red-400">*</span></label>
          <input
            type="number"
            required
            min={1}
            value={formData.quantity}
            onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Unit Price <span className="text-red-400">*</span></label>
          <input
            type="number"
            required
            min={0}
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => setFormData((p) => ({ ...p, unitPrice: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Total Amount</label>
          <input
            type="text"
            readOnly
            value={computedTotal > 0 ? fmtCurrency(computedTotal) : "—"}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Payment Method</label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData((p) => ({ ...p, paymentMethod: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Recorded By</label>
          <input
            type="text"
            value={formData.recordedBy}
            onChange={(e) => setFormData((p) => ({ ...p, recordedBy: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1">Notes</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition"
          >
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
    </div>
  );
}

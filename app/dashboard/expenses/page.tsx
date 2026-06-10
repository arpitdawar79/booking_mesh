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
    Receipt,
    Search,
    Trash2,
    X,
    Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Expense {
  id: string;
  date: string | Date;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  recordedBy: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  utilities: "Utilities",
  maintenance: "Maintenance",
  salaries: "Salaries",
  food_beverages: "Food & Beverages",
  supplies: "Supplies",
  marketing: "Marketing",
  transport: "Transport",
  misc: "Miscellaneous",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const PAYMENT_OPTIONS = ["cash", "upi", "card", "bank_transfer"];

function fmtDate(d: string | Date): string {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  return d.toISOString().split("T")[0];
}

function fmtCurrency(n: number): string {
  return `\u20b9${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ExpensesPage() {
  const { success, error } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl+E");
  const pageSize = 20;

  useEffect(() => {
    setShortcutLabel(navigator.platform.includes("Mac") ? "⌘E" : "Ctrl+E");
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (month) params.set("month", month);

    fetch(`/api/expenses?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setExpenses(data.expenses || []);
        setTotal(data.total || 0);
        setTotalAmount(data.summary?.totalAmount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search, category, month]);

  useEffect(() => {
    setPage(1);
  }, [search, category, month]);

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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
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
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      success("Expense deleted");
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setTotal((t) => t - 1);
    } else {
      error("Failed to delete expense");
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
          <Receipt className="w-5 h-5 text-rose-400" />
          Expense Ledger
        </h1>
        <button
          onClick={openAdd}
          className="rounded-lg bg-foreground text-background px-4 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1 self-start"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Expense
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
            placeholder="Search expenses..."
            className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring w-40 sm:w-56"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {(search || category || month) && (
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
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
        title={editingId ? "Edit Expense" : "Add Expense"}
      >
        <ExpenseForm
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

      {loading && expenses.length === 0 ? (
        <div className="text-muted-foreground">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          No expenses found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Method</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Recorded By
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(e.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {CATEGORY_LABELS[e.category] || e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">{e.description}</td>
                    <td className="px-4 py-3 font-medium">
                      {fmtCurrency(Number(e.amount))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {e.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.recordedBy || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(e.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
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

function ExpenseForm({
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
    category: "misc",
    description: "",
    amount: "",
    paymentMethod: "cash",
    recordedBy: "",
    receiptUrl: "",
    notes: "",
  });

  useEffect(() => {
    if (editingId) {
      fetch(`/api/expenses?id=${editingId}`)
        .then((r) => r.json())
        .then((data) => {
          const e = data.expense;
          if (e) {
            setFormData({
              date: fmtDate(e.date),
              category: e.category,
              description: e.description,
              amount: String(e.amount),
              paymentMethod: e.paymentMethod,
              recordedBy: e.recordedBy || "",
              receiptUrl: e.receiptUrl || "",
              notes: e.notes || "",
            });
          }
        });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        category: "misc",
        description: "",
        amount: "",
        paymentMethod: "cash",
        recordedBy: "",
        receiptUrl: "",
        notes: "",
      });
    }
  }, [editingId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(
        "expense-description",
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
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      recordedBy: formData.recordedBy || undefined,
      receiptUrl: formData.receiptUrl || undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) payload.id = editingId;

    const res = await fetch("/api/expenses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      success(editingId ? "Expense updated" : "Expense added");
      onSaved();
    } else {
      error("Failed to save expense");
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
            Category <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
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
                {m.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">
          Description <span className="text-red-400">*</span>
        </label>
        <input
          id="expense-description"
          type="text"
          required
          value={formData.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="What was this expense for?"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Recorded By</label>
          <input
            type="text"
            value={formData.recordedBy}
            onChange={(e) => update("recordedBy", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Receipt URL</label>
          <input
            type="url"
            value={formData.receiptUrl}
            onChange={(e) => update("receiptUrl", e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
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

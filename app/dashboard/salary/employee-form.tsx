"use client";

import { Save, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fmtDate } from "./page";

export function EmployeeForm({
  editingId,
  onClose,
  onSaved,
}: {
  editingId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    phone: "",
    designation: "Staff",
    monthlySalary: "",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "active",
  });

  useEffect(() => {
    if (editingId) {
      fetch(`/api/salary?type=employees&id=${editingId}`)
        .then((r) => r.json())
        .then((data) => {
          const e = data.employee;
          if (e) {
            setFormData({
              name: e.name,
              phone: e.phone || "",
              designation: e.designation,
              monthlySalary: String(e.monthlySalary),
              joiningDate: fmtDate(e.joiningDate),
              status: e.status,
            });
          }
        });
    }
  }, [editingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      type: "employee",
      name: formData.name,
      phone: formData.phone || undefined,
      designation: formData.designation,
      monthlySalary: Number(formData.monthlySalary),
      joiningDate: formData.joiningDate,
      status: formData.status,
    };
    if (editingId) payload.id = editingId;
    const res = await fetch("/api/salary", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert("Failed to save employee.");
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900 via-[#0d1525] to-slate-900 p-6 shadow-xl">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            {editingId ? "Edit Employee" : "Add Employee"}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, name: e.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Phone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) =>
              setFormData((p) => ({ ...p, phone: e.target.value }))
            }
            placeholder="For WhatsApp salary slips"
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Designation
          </label>
          <input
            type="text"
            value={formData.designation}
            onChange={(e) =>
              setFormData((p) => ({ ...p, designation: e.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Monthly Salary <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            required
            min={0}
            step="0.01"
            value={formData.monthlySalary}
            onChange={(e) =>
              setFormData((p) => ({ ...p, monthlySalary: e.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Joining Date <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.joiningDate}
            onChange={(e) =>
              setFormData((p) => ({ ...p, joiningDate: e.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData((p) => ({ ...p, status: e.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          >
            <option value="active" className="bg-slate-900">
              Active
            </option>
            <option value="inactive" className="bg-slate-900">
              Inactive
            </option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-white text-slate-900 px-5 py-2.5 text-xs font-semibold hover:bg-white/90 disabled:opacity-50 active:scale-[0.98] transition flex items-center gap-1.5 shadow-lg shadow-white/10"
          >
            <Save className="w-3.5 h-3.5" />{" "}
            {saving ? "Saving..." : editingId ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { Calculator, Receipt, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fmtDate } from "./page";

interface Employee {
  id: string;
  name: string;
  phone: string | null;
  designation: string;
  monthlySalary: number;
  joiningDate: string | Date;
  status: string;
}

export function SlipForm({
  employee,
  editingSlipId,
  onClose,
  onSaved,
}: {
  employee: Employee;
  editingSlipId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const now = new Date();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    daysWorked: "30",
    totalDays: "30",
    basicSalary: String(employee.monthlySalary),
    overtimeDays: "0",
    overtimeRate: "0",
    overtimeAmount: "0",
    allowance: "0",
    deduction: "0",
    deductionReason: "",
    netSalary: String(employee.monthlySalary),
    paymentMethod: "cash",
    paymentDate: now.toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (editingSlipId) {
      fetch(`/api/salary?type=slips&id=${editingSlipId}`)
        .then((r) => r.json())
        .then((data) => {
          const s = data.slip;
          if (s) {
            setFormData({
              month: String(s.month),
              year: String(s.year),
              daysWorked: String(s.daysWorked),
              totalDays: String(s.totalDays),
              basicSalary: String(s.basicSalary),
              overtimeDays: String(s.overtimeDays),
              overtimeRate: String(s.overtimeRate),
              overtimeAmount: String(s.overtimeAmount),
              allowance: String(s.allowance),
              deduction: String(s.deduction),
              deductionReason: s.deductionReason || "",
              netSalary: String(s.netSalary),
              paymentMethod: s.paymentMethod,
              paymentDate: s.paymentDate ? fmtDate(s.paymentDate) : "",
              notes: s.notes || "",
            });
          }
        });
    }
  }, [editingSlipId]);

  function recalculateNet(current: Record<string, string>) {
    const basic = Number(current.basicSalary) || 0;
    const ot = Number(current.overtimeAmount) || 0;
    const allowance = Number(current.allowance) || 0;
    const deduction = Number(current.deduction) || 0;
    const net = basic + ot + allowance - deduction;
    return String(Math.max(0, net));
  }

  function updateField(key: string, value: string) {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (
        ["basicSalary", "overtimeAmount", "allowance", "deduction"].includes(
          key,
        )
      ) {
        next.netSalary = recalculateNet(next);
      }
      if (key === "overtimeDays" || key === "overtimeRate") {
        const days = Number(next.overtimeDays) || 0;
        const rate = Number(next.overtimeRate) || 0;
        next.overtimeAmount = String(days * rate);
        next.netSalary = recalculateNet(next);
      }
      if (key === "daysWorked" || key === "totalDays") {
        const worked = Number(next.daysWorked) || 0;
        const total = Number(next.totalDays) || 1;
        const monthly = Number(employee.monthlySalary) || 0;
        const daily = monthly / total;
        next.basicSalary = String(Math.round(daily * worked));
        next.netSalary = recalculateNet(next);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      type: "slip",
      employeeId: employee.id,
      month: Number(formData.month),
      year: Number(formData.year),
      daysWorked: Number(formData.daysWorked),
      totalDays: Number(formData.totalDays),
      basicSalary: Number(formData.basicSalary),
      overtimeDays: Number(formData.overtimeDays),
      overtimeRate: Number(formData.overtimeRate),
      overtimeAmount: Number(formData.overtimeAmount),
      allowance: Number(formData.allowance),
      deduction: Number(formData.deduction),
      deductionReason: formData.deductionReason || undefined,
      netSalary: Number(formData.netSalary),
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate || undefined,
      notes: formData.notes || undefined,
    };
    if (editingSlipId) {
      payload.id = editingSlipId;
    }
    const res = await fetch("/api/salary", {
      method: editingSlipId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert("Failed to save salary slip.");
  }

  const netDisplay = Number(formData.netSalary).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900 via-[#0d1525] to-slate-900 p-6 shadow-xl">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {editingSlipId ? "Edit Salary Slip" : "Generate Salary Slip"}
            </h2>
            <p className="text-[11px] text-slate-400">
              {employee.name} — {employee.designation}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-5 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Month <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={formData.month}
              onChange={(e) => updateField("month", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1} className="bg-slate-900">
                  {
                    [
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ][i]
                  }
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Year <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              min={2000}
              max={2100}
              value={formData.year}
              onChange={(e) => updateField("year", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Days Worked <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              max={31}
              value={formData.daysWorked}
              onChange={(e) => updateField("daysWorked", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Total Days <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={31}
              value={formData.totalDays}
              onChange={(e) => updateField("totalDays", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Basic Salary <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={formData.basicSalary}
              onChange={(e) => updateField("basicSalary", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              OT Days
            </label>
            <input
              type="number"
              min={0}
              value={formData.overtimeDays}
              onChange={(e) => updateField("overtimeDays", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              OT Rate/day
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formData.overtimeRate}
              onChange={(e) => updateField("overtimeRate", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              OT Amount
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formData.overtimeAmount}
              onChange={(e) => updateField("overtimeAmount", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Allowance
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formData.allowance}
              onChange={(e) => updateField("allowance", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Deduction
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formData.deduction}
              onChange={(e) => updateField("deduction", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Deduction Reason
            </label>
            <input
              type="text"
              value={formData.deductionReason}
              onChange={(e) =>
                setFormData((p) => ({ ...p, deductionReason: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Net Salary <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={formData.netSalary}
              onChange={(e) => updateField("netSalary", e.target.value)}
              className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-semibold text-emerald-400 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData((p) => ({ ...p, paymentMethod: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            >
              <option value="cash" className="bg-slate-900">
                Cash
              </option>
              <option value="upi" className="bg-slate-900">
                UPI
              </option>
              <option value="card" className="bg-slate-900">
                Card
              </option>
              <option value="bank_transfer" className="bg-slate-900">
                Bank Transfer
              </option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData((p) => ({ ...p, paymentDate: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
            />
          </div>
          <div className="flex items-end">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm w-full">
              <div className="flex items-center gap-2 text-emerald-400/80">
                <Calculator className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Net Payable
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                ₹{netDisplay}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Notes
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) =>
              setFormData((p) => ({ ...p, notes: e.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>

        <div className="flex items-end gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-white text-slate-900 px-5 py-2.5 text-xs font-semibold hover:bg-white/90 disabled:opacity-50 active:scale-[0.98] transition flex items-center gap-1.5 shadow-lg shadow-white/10"
          >
            <Save className="w-3.5 h-3.5" />{" "}
            {saving
              ? "Saving..."
              : editingSlipId
                ? "Update Slip"
                : "Generate Slip"}
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

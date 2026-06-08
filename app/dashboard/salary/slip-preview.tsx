"use client";

import { X, Building2, User, Calendar, IndianRupee, Wallet, Phone, FileText, CheckCircle2, Printer } from "lucide-react";
import { useRef } from "react";

interface SlipPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  slip: {
    id: string;
    month: number;
    year: number;
    daysWorked: number;
    totalDays: number;
    basicSalary: number;
    overtimeDays: number;
    overtimeRate: number;
    overtimeAmount: number;
    allowance: number;
    deduction: number;
    deductionReason: string | null;
    netSalary: number;
    paymentMethod: string;
    paymentDate: string | Date | null;
    notes: string | null;
    whatsappSentAt: string | Date | null;
    employee?: {
      name: string;
      designation: string;
      phone: string | null;
    } | null;
  };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtCurrency(n: number): string {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | Date | null): string {
  if (!d) return "—";
  if (typeof d === "string") return d.split("T")[0];
  return d.toISOString().split("T")[0];
}

export function SlipPreview({ isOpen, onClose, slip }: SlipPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !slip) return null;

  const emp = slip.employee;
  const period = `${MONTH_NAMES[slip.month - 1]} ${slip.year}`;

  const earnings = [
    { label: "Basic Salary", amount: Number(slip.basicSalary) },
    ...(Number(slip.overtimeAmount) > 0 ? [{ label: `Overtime (${slip.overtimeDays} days @ ₹${slip.overtimeRate}/day)`, amount: Number(slip.overtimeAmount) }] : []),
    ...(Number(slip.allowance) > 0 ? [{ label: "Allowance", amount: Number(slip.allowance) }] : []),
  ];

  const deductions = [
    ...(Number(slip.deduction) > 0 ? [{ label: slip.deductionReason || "Deduction", amount: Number(slip.deduction) }] : []),
  ];

  const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0);
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f1a] shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0a0f1a]/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Salary Slip Preview</h3>
              <p className="text-[11px] text-slate-400">{period} — {emp?.name || "Employee"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        </div>

        {/* Slip Document */}
        <div ref={printRef} className="p-6 sm:p-8 space-y-6">
          {/* Company Header */}
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-[#0d1525] border border-white/10 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">The Stream by Ekantah</h2>
                    <p className="text-xs text-slate-400">Tirthan Valley, Himachal Pradesh</p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Paid</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Slip Ref: {slip.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Employee Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                Employee Details
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Name</p>
                  <p className="text-sm font-semibold text-white">{emp?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Designation</p>
                  <p className="text-sm text-slate-300">{emp?.designation || "—"}</p>
                </div>
                {emp?.phone && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-slate-300">{emp.phone}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                Period & Attendance
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Salary Period</p>
                  <p className="text-sm font-semibold text-white">{period}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Days Worked</p>
                  <p className="text-sm text-slate-300">{slip.daysWorked} <span className="text-slate-500">/ {slip.totalDays}</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Payment Date</p>
                  <p className="text-sm text-slate-300">{fmtDate(slip.paymentDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="rounded-xl bg-gradient-to-b from-emerald-950/30 to-transparent border border-emerald-500/10 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                <IndianRupee className="w-3.5 h-3.5" />
                Earnings
              </div>
              <div className="space-y-2.5">
                {earnings.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-slate-300">{e.label}</span>
                    <span className="text-sm font-medium text-white">{fmtCurrency(e.amount)}</span>
                  </div>
                ))}
                {earnings.length === 0 && <p className="text-sm text-slate-500 italic">No earnings recorded</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Earnings</span>
                <span className="text-base font-bold text-emerald-400">{fmtCurrency(totalEarnings)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="rounded-xl bg-gradient-to-b from-rose-950/30 to-transparent border border-rose-500/10 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-4">
                <Wallet className="w-3.5 h-3.5" />
                Deductions
              </div>
              <div className="space-y-2.5">
                {deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-slate-300">{d.label}</span>
                    <span className="text-sm font-medium text-rose-300">{fmtCurrency(d.amount)}</span>
                  </div>
                ))}
                {deductions.length === 0 && <p className="text-sm text-slate-500 italic">No deductions</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Total Deductions</span>
                <span className="text-base font-bold text-rose-400">{fmtCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="relative rounded-2xl bg-gradient-to-r from-emerald-950/50 via-teal-950/30 to-emerald-950/50 border border-emerald-500/20 p-6 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">Net Salary Payable</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Payment via {slip.paymentMethod.replace("_", " ").toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{fmtCurrency(Number(slip.netSalary))}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {slip.notes && (
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-300">{slip.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-[10px] text-slate-600">
              This is a computer-generated salary slip and does not require a physical signature.
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              For queries, contact management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

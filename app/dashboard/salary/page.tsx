"use client";

import { Pagination } from "@/components/ui/pagination";
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    ChevronRight,
    Clock,
    Eye,
    IndianRupee,
    MessageCircle,
    Pencil,
    PersonStanding,
    PlusCircle,
    Search,
    Send,
    Smartphone,
    Trash2,
    User,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EmployeeForm } from "./employee-form";
import { SlipForm } from "./slip-form";
import { SlipPreview } from "./slip-preview";

interface Employee {
  id: string;
  name: string;
  phone: string | null;
  designation: string;
  monthlySalary: number;
  joiningDate: string | Date;
  status: string;
  salarySlips?: SalarySlip[];
}

interface SalarySlip {
  id: string;
  employeeId: string;
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
  employee?: Employee;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export function fmtDate(d: string | Date | null): string {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  return d.toISOString().split("T")[0];
}

export function fmtCurrency(n: number): string {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalaryPage() {
  const [view, setView] = useState<"employees" | "slips" | "employee-detail">(
    "employees",
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSlipForm, setShowSlipForm] = useState(false);
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [slipMonth, setSlipMonth] = useState("");
  const [previewSlip, setPreviewSlip] = useState<SalarySlip | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, view]);

  useEffect(() => {
    if (view === "employees" || view === "employee-detail") fetchEmployees();
    else fetchSlips();
  }, [view, page, pageSize, search, slipMonth]);

  async function fetchEmployees() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("type", "employees");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    try {
      const res = await fetch(`/api/salary?${params}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setTotal(data.total || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlips() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("type", "slips");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (slipMonth) params.set("month", slipMonth);
    if (search.trim()) params.set("search", search.trim());
    try {
      const res = await fetch(`/api/salary?${params}`);
      const data = await res.json();
      setSlips(data.slips || []);
      setTotal(data.total || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployeeDetail(id: string) {
    try {
      const res = await fetch(`/api/salary?type=employees&id=${id}`);
      const data = await res.json();
      if (data.employee) {
        setSelectedEmployee(data.employee);
        setView("employee-detail");
      }
    } catch {
      /* ignore */
    }
  }

  async function handleDeleteEmployee(id: string) {
    if (
      !confirm("Delete this employee? All salary slips will also be deleted.")
    )
      return;
    const res = await fetch(`/api/salary?type=employee&id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setEmployees((p) => p.filter((e) => e.id !== id));
      setTotal((t) => t - 1);
    }
  }

  async function handleDeleteSlip(id: string) {
    if (!confirm("Delete this salary slip?")) return;
    const res = await fetch(`/api/salary?type=slip&id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSlips((p) => p.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
      if (selectedEmployee) fetchEmployeeDetail(selectedEmployee.id);
    }
  }

  async function handleSendWhatsApp(slip: SalarySlip) {
    if (!slip.employee?.phone) {
      alert("Employee phone number not available.");
      return;
    }
    if (
      !confirm(
        `Send salary slip to ${slip.employee.name} at ${slip.employee.phone}?`,
      )
    )
      return;
    setSendingId(slip.id);
    try {
      const res = await fetch("/api/salary/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipId: slip.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Salary slip sent via WhatsApp!");
        if (view === "slips") fetchSlips();
        else if (selectedEmployee) fetchEmployeeDetail(selectedEmployee.id);
      } else alert(data.error || "Failed to send.");
    } catch {
      alert("Failed to send.");
    } finally {
      setSendingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 sm:p-6 shadow-md">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/10">
                <Banknote className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Salary &amp; Payroll
                </h1>
                <p className="text-xs text-muted-foreground">
                  Manage employees, generate salary slips &amp; send via
                  WhatsApp
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view !== "employees" && (
              <button
                onClick={() => {
                  setView("employees");
                  setSelectedEmployee(null);
                }}
                className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            {view === "employees" && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Employee
              </button>
            )}
            {view === "employee-detail" && selectedEmployee && (
              <button
                onClick={() => {
                  setEditingSlipId(null);
                  setShowSlipForm(true);
                }}
                className="rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Generate Slip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1 w-fit">
        {(["employees", "slips"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
               setView(v);
               setSelectedEmployee(null);
            }}
            className={`relative px-5 py-2 text-xs font-medium capitalize rounded-lg transition ${
              view === v || (v === "employees" && view === "employee-detail")
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "slips" ? "All Slips" : "Employees"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              view === "slips" ? "Search slips..." : "Search employees..."
            }
            className="pl-10 pr-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 w-44 sm:w-64"
          />
        </div>
        {view === "slips" && (
          <input
            type="month"
            value={slipMonth}
            onChange={(e) => {
              setSlipMonth(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        )}
        {(search || slipMonth) && (
          <button
            onClick={() => {
              setSearch("");
              setSlipMonth("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {showForm && (
        <EmployeeForm
          editingId={editingId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setEditingId(null);
            fetchEmployees();
          }}
        />
      )}
      {showSlipForm && selectedEmployee && (
        <SlipForm
          employee={selectedEmployee}
          editingSlipId={editingSlipId}
          onClose={() => {
            setShowSlipForm(false);
            setEditingSlipId(null);
          }}
          onSaved={() => {
            setShowSlipForm(false);
            setEditingSlipId(null);
            fetchEmployeeDetail(selectedEmployee.id);
          }}
        />
      )}
      {showPreview && previewSlip && (
        <SlipPreview
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewSlip(null);
          }}
          slip={previewSlip}
        />
      )}

      {(view === "employees" || view === "employee-detail") && (
        <>
          {view === "employees" && (
            <>
              {loading && employees.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : employees.length === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/15">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    No employees yet
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add your first employee to start managing payroll
                  </p>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setShowForm(true);
                    }}
                    className="rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Employee
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 sm:px-5 py-3 sm:py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="text-left px-3 sm:px-5 py-3 sm:py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Designation
                        </th>
                        <th className="text-left px-3 sm:px-5 py-3 sm:py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="text-left px-3 sm:px-5 py-3 sm:py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Monthly Salary
                        </th>
                        <th className="text-left px-3 sm:px-5 py-3 sm:py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-3 sm:px-5 py-3 sm:py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {employees.map((e) => (
                        <tr
                          key={e.id}
                          className="hover:bg-muted/30 cursor-pointer transition group"
                          onClick={() => fetchEmployeeDetail(e.id)}
                        >
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/15">
                                <User className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="font-medium text-foreground">
                                {e.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-muted-foreground">
                            {e.designation}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-muted-foreground">
                            {e.phone || "—"}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                            {fmtCurrency(Number(e.monthlySalary))}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${e.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/10" : "bg-muted text-muted-foreground border border-border"}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${e.status === "active" ? "bg-emerald-600 dark:bg-emerald-400" : "bg-muted-foreground"}`}
                              />
                              {e.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setEditingId(e.id);
                                  setShowForm(true);
                                }}
                                className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(e.id)}
                                className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}

          {view === "employee-detail" && selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Profile Card */}
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 sm:p-6 shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/15">
                      <PersonStanding className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight">
                        {selectedEmployee.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmployee.designation}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide self-start sm:self-auto ${selectedEmployee.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/10" : "bg-muted text-muted-foreground border border-border"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedEmployee.status === "active" ? "bg-emerald-600 dark:bg-emerald-400" : "bg-muted-foreground"}`}
                    />
                    {selectedEmployee.status}
                  </span>
                </div>
                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border text-sm">
                  <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-muted-foreground/70" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="text-foreground font-medium">
                        {selectedEmployee.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        Monthly Salary
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {fmtCurrency(Number(selectedEmployee.monthlySalary))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-muted-foreground/70" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        Joined
                      </p>
                      <p className="text-foreground font-medium">
                        {fmtDate(selectedEmployee.joiningDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Salary Slips
                </h3>
              </div>
              {!selectedEmployee.salarySlips ||
              selectedEmployee.salarySlips.length === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/15">
                    <Banknote className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    No salary slips yet
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Generate a slip to track monthly payroll
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Period
                        </th>
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Days
                        </th>
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Basic
                        </th>
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          OT
                        </th>
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Allowance
                        </th>
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Deduction
                        </th>
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Net
                        </th>
                        <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedEmployee.salarySlips.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-muted/30 transition"
                        >
                          <td className="px-5 py-4 font-medium text-foreground">
                            {MONTH_NAMES[s.month - 1]} {s.year}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {s.daysWorked}/{s.totalDays}
                          </td>
                          <td className="px-5 py-4 text-foreground">
                            {fmtCurrency(Number(s.basicSalary))}
                          </td>
                          <td className="px-5 py-4 text-foreground">
                            {Number(s.overtimeAmount) > 0
                              ? fmtCurrency(Number(s.overtimeAmount))
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-foreground">
                            {Number(s.allowance) > 0
                              ? fmtCurrency(Number(s.allowance))
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-rose-600 dark:text-rose-400">
                            {Number(s.deduction) > 0
                              ? fmtCurrency(Number(s.deduction))
                              : "—"}
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {fmtCurrency(Number(s.netSalary))}
                          </td>
                          <td className="px-5 py-4">
                            {s.whatsappSentAt ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold">
                                <Send className="w-3 h-3" /> Sent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground border border-border px-2.5 py-1 text-[11px] font-semibold">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setPreviewSlip({
                                    ...s,
                                    employee: selectedEmployee,
                                  });
                                  setShowPreview(true);
                                }}
                                className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {selectedEmployee.phone && (
                                <button
                                  onClick={() =>
                                    handleSendWhatsApp({
                                      ...s,
                                      employee: selectedEmployee,
                                    })
                                  }
                                  disabled={sendingId === s.id}
                                  className="p-2 rounded-lg hover:bg-muted transition text-primary disabled:opacity-50"
                                  title="Send via WhatsApp"
                                >
                                  {sendingId === s.id ? (
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingSlipId(s.id);
                                  setShowSlipForm(true);
                                }}
                                className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlip(s.id)}
                                className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-destructive"
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
              )}
            </div>
          )}
        </>
      )}

      {view === "slips" && (
        <>
          {loading && slips.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slips.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/15">
                <Banknote className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No salary slips found
              </h3>
              <p className="text-xs text-muted-foreground">
                Generate a slip from an employee&apos;s profile
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Period
                    </th>
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Days
                    </th>
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Basic
                    </th>
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Net
                    </th>
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Method
                    </th>
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="text-right px-5 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {slips.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">
                          {s.employee?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.employee?.designation}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-foreground">
                        {MONTH_NAMES[s.month - 1]} {s.year}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {s.daysWorked}/{s.totalDays}
                      </td>
                      <td className="px-5 py-4 text-foreground">
                        {fmtCurrency(Number(s.basicSalary))}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {fmtCurrency(Number(s.netSalary))}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground capitalize">
                        {METHOD_LABELS[s.paymentMethod] || s.paymentMethod}
                      </td>
                      <td className="px-5 py-4">
                        {s.whatsappSentAt ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold">
                            <Send className="w-3 h-3" /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground border border-border px-2.5 py-1 text-[11px] font-semibold">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setPreviewSlip(s);
                              setShowPreview(true);
                            }}
                            className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {s.employee?.phone && (
                            <button
                              onClick={() => handleSendWhatsApp(s)}
                              disabled={sendingId === s.id}
                              className="p-2 rounded-lg hover:bg-muted transition text-primary disabled:opacity-50"
                              title="Send via WhatsApp"
                            >
                              {sendingId === s.id ? (
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <MessageCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSlip(s.id)}
                            className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-destructive"
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
          )}
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

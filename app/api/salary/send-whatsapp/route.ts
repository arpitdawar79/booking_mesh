import { type SalarySlipPdfData } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";
import { sendSalarySlipWhatsApp } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { slipId } = body;

  if (!slipId) {
    return NextResponse.json({ error: "slipId is required" }, { status: 400 });
  }

  const slip = await prisma.salarySlip.findUnique({
    where: { id: slipId },
    include: { employee: true },
  });

  if (!slip) {
    return NextResponse.json(
      { error: "Salary slip not found" },
      { status: 404 },
    );
  }

  if (!slip.employee.phone) {
    return NextResponse.json(
      { error: "Employee phone number not available" },
      { status: 400 },
    );
  }

  const monthNames = [
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

  const data: SalarySlipPdfData = {
    employeeName: slip.employee.name,
    designation: slip.employee.designation,
    phone: slip.employee.phone,
    month: monthNames[slip.month - 1],
    year: slip.year,
    daysWorked: slip.daysWorked,
    totalDays: slip.totalDays,
    basicSalary: Number(slip.basicSalary).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    overtimeDays: slip.overtimeDays,
    overtimeRate: Number(slip.overtimeRate).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    overtimeAmount: Number(slip.overtimeAmount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    allowance: Number(slip.allowance).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    deduction: Number(slip.deduction).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    deductionReason: slip.deductionReason,
    netSalary: Number(slip.netSalary).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    paymentMethod: slip.paymentMethod,
    paymentDate: slip.paymentDate
      ? slip.paymentDate.toISOString().split("T")[0]
      : null,
    notes: slip.notes,
    employerName: "The Stream by Ekantah",
    employerAddress: "Tirthan Valley, Himachal Pradesh",
    employerPhone: "+91 93193 47443, +91 99100 06437",
  };

  const result = await sendSalarySlipWhatsApp(slip.employee.phone, data);

  if (result.success) {
    await prisma.salarySlip.update({
      where: { id: slipId },
      data: { whatsappSentAt: new Date() },
    });
  }

  return NextResponse.json(result);
}

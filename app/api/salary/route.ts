import { prisma } from "@/lib/prisma";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  salarySlipCreateSchema,
  salarySlipUpdateSchema,
} from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'employees' | 'slips'
  const id = searchParams.get("id");
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month"); // yyyy-MM
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  if (type === "employees" || !type) {
    if (id) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { salarySlips: { orderBy: [{ year: "desc" }, { month: "desc" }] } },
      });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      return NextResponse.json({ employee });
    }

    const where: Record<string, unknown> = {};
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { designation: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({ employees, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }

  if (type === "slips") {
    if (id) {
      const slip = await prisma.salarySlip.findUnique({
        where: { id },
        include: { employee: true },
      });
      if (!slip) {
        return NextResponse.json({ error: "Salary slip not found" }, { status: 404 });
      }
      return NextResponse.json({ slip });
    }

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) {
      const [year, m] = month.split("-");
      where.month = Number(m);
      where.year = Number(year);
    }

    const [slips, total] = await Promise.all([
      prisma.salarySlip.findMany({
        where,
        include: { employee: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.salarySlip.count({ where }),
    ]);

    return NextResponse.json({ slips, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { type, ...data } = body;

  if (type === "employee") {
    const parsed = employeeCreateSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) },
        { status: 400 },
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        designation: parsed.data.designation,
        monthlySalary: parsed.data.monthlySalary,
        joiningDate: new Date(parsed.data.joiningDate),
        status: parsed.data.status,
      },
    });
    return NextResponse.json({ employee });
  }

  if (type === "slip") {
    const parsed = salarySlipCreateSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const slip = await prisma.salarySlip.create({
      data: {
        employeeId: d.employeeId,
        month: d.month,
        year: d.year,
        daysWorked: d.daysWorked,
        totalDays: d.totalDays,
        basicSalary: d.basicSalary,
        overtimeDays: d.overtimeDays,
        overtimeRate: d.overtimeRate,
        overtimeAmount: d.overtimeAmount,
        allowance: d.allowance,
        deduction: d.deduction,
        deductionReason: d.deductionReason || null,
        netSalary: d.netSalary,
        paymentMethod: d.paymentMethod,
        paymentDate: d.paymentDate ? new Date(d.paymentDate) : null,
        notes: d.notes || null,
      },
      include: { employee: true },
    });
    return NextResponse.json({ slip });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { type, ...data } = body;

  if (type === "employee") {
    const parsed = employeeUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (d.name !== undefined) updateData.name = d.name;
    if (d.phone !== undefined) updateData.phone = d.phone || null;
    if (d.designation !== undefined) updateData.designation = d.designation;
    if (d.monthlySalary !== undefined) updateData.monthlySalary = d.monthlySalary;
    if (d.joiningDate !== undefined) updateData.joiningDate = new Date(d.joiningDate);
    if (d.status !== undefined) updateData.status = d.status;

    const employee = await prisma.employee.update({ where: { id: d.id }, data: updateData });
    return NextResponse.json({ employee });
  }

  if (type === "slip") {
    const parsed = salarySlipUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (d.daysWorked !== undefined) updateData.daysWorked = d.daysWorked;
    if (d.totalDays !== undefined) updateData.totalDays = d.totalDays;
    if (d.basicSalary !== undefined) updateData.basicSalary = d.basicSalary;
    if (d.overtimeDays !== undefined) updateData.overtimeDays = d.overtimeDays;
    if (d.overtimeRate !== undefined) updateData.overtimeRate = d.overtimeRate;
    if (d.overtimeAmount !== undefined) updateData.overtimeAmount = d.overtimeAmount;
    if (d.allowance !== undefined) updateData.allowance = d.allowance;
    if (d.deduction !== undefined) updateData.deduction = d.deduction;
    if (d.deductionReason !== undefined) updateData.deductionReason = d.deductionReason || null;
    if (d.netSalary !== undefined) updateData.netSalary = d.netSalary;
    if (d.paymentMethod !== undefined) updateData.paymentMethod = d.paymentMethod;
    if (d.paymentDate !== undefined) updateData.paymentDate = d.paymentDate ? new Date(d.paymentDate) : null;
    if (d.notes !== undefined) updateData.notes = d.notes || null;

    const slip = await prisma.salarySlip.update({
      where: { id: d.id },
      data: updateData,
      include: { employee: true },
    });
    return NextResponse.json({ slip });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  if (type === "employee") {
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (type === "slip") {
    await prisma.salarySlip.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

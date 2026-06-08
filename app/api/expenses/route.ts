import { prisma } from "@/lib/prisma";
import { expenseCreateSchema, expenseUpdateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const month = searchParams.get("month"); // yyyy-MM
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  if (id) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ expense });
  }

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (month) {
    const [year, m] = month.split("-");
    const start = new Date(Number(year), Number(m) - 1, 1);
    const end = new Date(Number(year), Number(m), 1);
    where.date = { gte: start, lt: end };
  }
  if (search.trim()) {
    const q = search.trim();
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { recordedBy: { contains: q, mode: "insensitive" } },
    ];
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  // Compute summary for the filtered period
  const summary = await prisma.expense.aggregate({
    _sum: { amount: true },
    where,
  });

  return NextResponse.json({
    expenses,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    summary: { totalAmount: Number(summary._sum?.amount || 0) },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      date: new Date(data.date),
      category: data.category,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      recordedBy: data.recordedBy || null,
      receiptUrl: data.receiptUrl || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json({ expense });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = expenseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.recordedBy !== undefined) updateData.recordedBy = data.recordedBy || null;
  if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const expense = await prisma.expense.update({
    where: { id: data.id },
    data: updateData,
  });

  return NextResponse.json({ expense });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

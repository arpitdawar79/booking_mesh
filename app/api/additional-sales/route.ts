import { prisma } from "@/lib/prisma";
import { additionalSaleCreateSchema, additionalSaleUpdateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const month = searchParams.get("month"); // yyyy-MM
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  if (id) {
    const sale = await prisma.additionalSale.findUnique({ where: { id } });
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    return NextResponse.json({ sale });
  }

  const where: Record<string, unknown> = {};
  if (month) {
    const [year, m] = month.split("-");
    const start = new Date(Number(year), Number(m) - 1, 1);
    const end = new Date(Number(year), Number(m), 1);
    where.date = { gte: start, lt: end };
  }
  if (search.trim()) {
    const q = search.trim();
    where.OR = [
      { guestName: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  const [sales, total] = await Promise.all([
    prisma.additionalSale.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.additionalSale.count({ where }),
  ]);

  const summary = await prisma.additionalSale.aggregate({
    _sum: { amount: true },
    where,
  });

  return NextResponse.json({
    sales,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    summary: {
      totalAmount: Number(summary._sum?.amount || 0),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = additionalSaleCreateSchema.safeParse(body);
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

  const sale = await prisma.additionalSale.create({
    data: {
      date: new Date(data.date),
      guestName: data.guestName,
      saleType: data.saleType,
      guestType: data.guestType,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
    },
  });

  return NextResponse.json({ sale });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = additionalSaleUpdateSchema.safeParse(body);
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
  const existing = await prisma.additionalSale.findUnique({ where: { id: data.id } });
  if (!existing) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.guestName !== undefined) updateData.guestName = data.guestName;
  if (data.saleType !== undefined) updateData.saleType = data.saleType;
  if (data.guestType !== undefined) updateData.guestType = data.guestType;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const sale = await prisma.additionalSale.update({
    where: { id: data.id },
    data: updateData,
  });

  return NextResponse.json({ sale });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.additionalSale.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

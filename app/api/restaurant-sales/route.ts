import { prisma } from "@/lib/prisma";
import { restaurantSaleCreateSchema, restaurantSaleUpdateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const month = searchParams.get("month"); // yyyy-MM
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  if (id) {
    const sale = await prisma.restaurantSale.findUnique({ where: { id } });
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
      { itemName: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { recordedBy: { contains: q, mode: "insensitive" } },
    ];
  }

  const [sales, total] = await Promise.all([
    prisma.restaurantSale.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.restaurantSale.count({ where }),
  ]);

  const summary = await prisma.restaurantSale.aggregate({
    _sum: { totalAmount: true, quantity: true },
    where,
  });

  return NextResponse.json({
    sales,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    summary: {
      totalAmount: Number(summary._sum?.totalAmount || 0),
      totalQuantity: Number(summary._sum?.quantity || 0),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = restaurantSaleCreateSchema.safeParse(body);
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
  // Auto-compute totalAmount if it doesn't match quantity * unitPrice
  const computedTotal = Number(data.unitPrice) * data.quantity;
  const totalAmount = Math.abs(Number(data.totalAmount) - computedTotal) < 0.01 ? data.totalAmount : computedTotal;

  const sale = await prisma.restaurantSale.create({
    data: {
      date: new Date(data.date),
      itemName: data.itemName,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalAmount,
      paymentMethod: data.paymentMethod,
      recordedBy: data.recordedBy || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json({ sale });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = restaurantSaleUpdateSchema.safeParse(body);
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
  const existing = await prisma.restaurantSale.findUnique({ where: { id: data.id } });
  if (!existing) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.itemName !== undefined) updateData.itemName = data.itemName;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.recordedBy !== undefined) updateData.recordedBy = data.recordedBy || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  // Recompute totalAmount if quantity or unitPrice changed
  const qty = (updateData.quantity as number) ?? existing.quantity;
  const price = (updateData.unitPrice as number) ?? Number(existing.unitPrice);
  updateData.totalAmount = Number(qty) * Number(price);

  const sale = await prisma.restaurantSale.update({
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

  await prisma.restaurantSale.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

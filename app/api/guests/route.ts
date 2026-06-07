import { prisma } from "@/lib/prisma";
import { guestCreateSchema, guestUpdateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const phone = searchParams.get("phone");
  const email = searchParams.get("email");
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  if (id) {
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { checkInDate: "desc" },
          include: { payments: true },
        },
      },
    });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    // Compute guest stats
    const totalRevenue = guest.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const totalNights = guest.bookings.reduce((sum, b) => sum + b.nightCount, 0);
    const avgStayLength = guest.bookings.length > 0 ? totalNights / guest.bookings.length : 0;
    const roomTypeCounts: Record<string, number> = {};
    for (const b of guest.bookings) {
      roomTypeCounts[b.roomType] = (roomTypeCounts[b.roomType] || 0) + 1;
    }
    const preferredRoomType = Object.entries(roomTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return NextResponse.json({
      guest,
      stats: { totalRevenue, totalNights, avgStayLength: Math.round(avgStayLength * 10) / 10, preferredRoomType, totalStays: guest.bookings.length },
    });
  }

  const where: Record<string, unknown> = {};
  if (phone) where.phone = phone;
  if (email) where.email = email;
  if (search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [guests, total] = await Promise.all([
    prisma.guest.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.guest.count({ where }),
  ]);

  return NextResponse.json({ guests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = guestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) }, { status: 400 });
  }

  const data = parsed.data;
  const guest = await prisma.guest.create({
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      idType: data.idType || null,
      idNumber: data.idNumber || null,
      address: data.address || null,
      preferences: data.preferences || null,
    },
  });

  return NextResponse.json({ guest });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = guestUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.idType !== undefined) updateData.idType = data.idType || null;
  if (data.idNumber !== undefined) updateData.idNumber = data.idNumber || null;
  if (data.address !== undefined) updateData.address = data.address || null;
  if (data.preferences !== undefined) updateData.preferences = data.preferences || null;

  const guest = await prisma.guest.update({
    where: { id: data.id },
    data: updateData,
  });

  return NextResponse.json({ guest });
}

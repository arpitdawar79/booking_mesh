import { toErrorResponse } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { sumAllocationsByType } from "@/lib/room-allocations";
import { availabilityQuerySchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    return await handleGET(request);
  } catch (err) {
    return toErrorResponse(err, "GET /api/availability");
  }
}

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse({
    checkInDate: searchParams.get("checkInDate"),
    checkOutDate: searchParams.get("checkOutDate"),
    roomType: searchParams.get("roomType") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) }, { status: 400 });
  }

  const { checkInDate, checkOutDate, roomType } = parsed.data;
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  const configs = roomType
    ? await prisma.propertyConfig.findMany({ where: { roomType } })
    : await prisma.propertyConfig.findMany();

  const overlapping = await prisma.booking.findMany({
    where: {
      status: { in: ["confirmed", "completed"] },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
    select: { roomType: true, roomCount: true },
  });
  const bookedByType = sumAllocationsByType(overlapping);

  const results = configs.map((config) => {
    const booked = bookedByType.get(config.roomType) ?? 0;
    return {
      roomType: config.roomType,
      totalRooms: config.totalRooms,
      bookedRooms: booked,
      availableRooms: Math.max(0, config.totalRooms - booked),
      basePrice: config.basePrice !== null ? Number(config.basePrice) : null,
    };
  });

  return NextResponse.json({ availability: results });
}

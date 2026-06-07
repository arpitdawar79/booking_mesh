import { prisma } from "@/lib/prisma";
import { availabilityQuerySchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

  const results = await Promise.all(
    configs.map(async (config) => {
      const overlapping = await prisma.booking.aggregate({
        _sum: { roomCount: true },
        where: {
          status: { in: ["confirmed", "completed"] },
          roomType: config.roomType,
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });
      const booked = Number(overlapping._sum.roomCount || 0);
      return {
        roomType: config.roomType,
        totalRooms: config.totalRooms,
        bookedRooms: booked,
        availableRooms: Math.max(0, config.totalRooms - booked),
      };
    }),
  );

  return NextResponse.json({ availability: results });
}

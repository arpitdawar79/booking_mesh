import { prisma } from "@/lib/prisma";

export interface ParsedAllocation {
  roomType: string;
  count: number;
}

const SEGMENT = /^\s*(\d+)\s+(.+?)\s*$/;

/**
 * Booking.roomType is either a plain type ("Boutique Room") or a composite
 * allocation string produced by the wizard ("3 Balcony Room, 2 Non-Balcony Room").
 */
export function parseRoomAllocations(
  roomType: string,
  roomCount: number,
): ParsedAllocation[] {
  const segments = roomType.split(",");
  const parsed: ParsedAllocation[] = [];
  for (const seg of segments) {
    const m = seg.match(SEGMENT);
    if (!m) {
      return [{ roomType: roomType.trim(), count: roomCount }];
    }
    parsed.push({ roomType: m[2], count: parseInt(m[1], 10) });
  }
  if (parsed.length === 0) {
    return [{ roomType: roomType.trim(), count: roomCount }];
  }
  return parsed;
}

export function sumAllocationsByType(
  bookings: Array<{ roomType: string; roomCount: number }>,
): Map<string, number> {
  const byType = new Map<string, number>();
  for (const b of bookings) {
    for (const a of parseRoomAllocations(b.roomType, b.roomCount)) {
      byType.set(a.roomType, (byType.get(a.roomType) ?? 0) + a.count);
    }
  }
  return byType;
}

export interface CapacityViolation {
  roomType: string;
  booked: number;
  requested: number;
  total: number;
}

export async function findCapacityViolation(opts: {
  roomType: string;
  roomCount: number;
  checkIn: Date;
  checkOut: Date;
  excludeBookingId?: string;
}): Promise<CapacityViolation | null> {
  const { roomType, roomCount, checkIn, checkOut, excludeBookingId } = opts;

  const configs = await prisma.propertyConfig.findMany();
  if (configs.length === 0) return null;
  const configByType = new Map(configs.map((c) => [c.roomType, c.totalRooms]));

  const requested = parseRoomAllocations(roomType, roomCount).filter((a) =>
    configByType.has(a.roomType),
  );
  if (requested.length === 0) return null;

  const overlapping = await prisma.booking.findMany({
    where: {
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      status: { in: ["confirmed", "completed"] },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
    select: { roomType: true, roomCount: true },
  });

  const bookedByType = sumAllocationsByType(overlapping);

  for (const a of requested) {
    const total = configByType.get(a.roomType)!;
    const booked = bookedByType.get(a.roomType) ?? 0;
    if (booked + a.count > total) {
      return { roomType: a.roomType, booked, requested: a.count, total };
    }
  }
  return null;
}

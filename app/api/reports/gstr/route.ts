import { prisma } from "@/lib/prisma";
import { gstrExportSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = gstrExportSchema.safeParse({
    month: searchParams.get("month"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) }, { status: 400 });
  }

  const { month } = parsed.data;
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { notIn: ["cancelled", "archived"] },
      bookingDate: { gte: start, lt: end },
      gstRate: { not: null },
    },
    select: {
      bookingId: true,
      bookingDate: true,
      guestFullName: true,
      totalAmount: true,
      gstRate: true,
      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,
      hsnCode: true,
    },
  });

  const rows = bookings.map((b) => {
    const total = Number(b.totalAmount);
    const gstRate = Number(b.gstRate || 0);
    const taxableValue = total / (1 + gstRate / 100);
    return {
      bookingId: b.bookingId,
      date: b.bookingDate.toISOString().split("T")[0],
      guestName: b.guestFullName,
      hsnCode: b.hsnCode,
      taxableValue: taxableValue.toFixed(2),
      cgst: Number(b.cgstAmount || 0).toFixed(2),
      sgst: Number(b.sgstAmount || 0).toFixed(2),
      igst: Number(b.igstAmount || 0).toFixed(2),
      total: total.toFixed(2),
    };
  });

  // Build CSV
  const headers = ["Booking ID", "Date", "Guest Name", "HSN Code", "Taxable Value", "CGST", "SGST", "IGST", "Total"];
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [r.bookingId, r.date, `"${r.guestName}"`, r.hsnCode, r.taxableValue, r.cgst, r.sgst, r.igst, r.total].join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gstr-${month}.csv"`,
    },
  });
}

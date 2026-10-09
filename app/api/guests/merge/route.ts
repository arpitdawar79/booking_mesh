import { NextResponse } from "next/server";
import { z } from "zod";
import { requireGuestStaff } from "@/lib/guests/auth";
import { mergeGuests } from "@/lib/guests/identity";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function POST(request: Request) {
  try {
    const user = await requireGuestStaff(true),
      p = z
        .object({ targetId: z.string().min(1), sourceId: z.string().min(1) })
        .safeParse(await request.json());
    if (!p.success)
      throw new HttpError(400, "Choose source and destination profiles");
    return NextResponse.json(
      await mergeGuests(p.data.targetId, p.data.sourceId, user.id),
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}

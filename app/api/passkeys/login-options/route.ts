import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

let simpleWebAuthn: any = null;
try {
  simpleWebAuthn = require("@simplewebauthn/server");
} catch {
  simpleWebAuthn = null;
}

export async function POST(req: NextRequest) {
  if (!simpleWebAuthn) {
    return NextResponse.json(
      {
        error:
          "Passkeys not configured. Run: npm install @simplewebauthn/server",
      },
      { status: 501 },
    );
  }

  const body = await req.json();
  const { email } = body;
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const credentials = await prisma.passkeyCredential.findMany({
    where: { userId: user.id },
  });

  const rpID = process.env.PASSKEY_RP_ID || "localhost";

  const options = await simpleWebAuthn.generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map(
      (c: { credentialId: string; transports: string }) => ({
        id: c.credentialId,
        transports: c.transports.split(","),
      }),
    ),
    userVerification: "preferred",
  });

  const response = NextResponse.json(options);
  response.cookies.set("passkey_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 5,
    path: "/",
  });
  return response;
}

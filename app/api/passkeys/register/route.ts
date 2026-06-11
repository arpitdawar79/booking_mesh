import { getUserFromToken } from "@/lib/auth";
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
      { error: "Passkeys not configured. Run: npm install @simplewebauthn/server" },
      { status: 501 },
    );
  }

  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const challenge = req.cookies.get("passkey_challenge")?.value;

  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
  }

  const rpID = process.env.PASSKEY_RP_ID || "localhost";

  let verification;
  try {
    verification = await simpleWebAuthn.verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: req.headers.get("origin") || `https://${rpID}`,
      expectedRPID: rpID,
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { registrationInfo } = verification;
  if (!registrationInfo) {
    return NextResponse.json({ error: "No registration info" }, { status: 400 });
  }

  await prisma.passkeyCredential.create({
    data: {
      userId: user.id,
      credentialId: registrationInfo.credentialID,
      publicKey: Buffer.from(registrationInfo.credentialPublicKey).toString("base64"),
      counter: registrationInfo.counter,
      transports: (body.response?.transports || []).join(","),
      deviceName: body.response?.clientExtensionResults?.deviceName || "Unknown",
    },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("passkey_challenge");
  return response;
}

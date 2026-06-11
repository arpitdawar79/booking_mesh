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
  const { email, credential } = body;
  if (!email || !credential) {
    return NextResponse.json(
      { error: "Email and credential required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const dbCredential = await prisma.passkeyCredential.findFirst({
    where: { userId: user.id, credentialId: credential.id },
  });

  if (!dbCredential) {
    return NextResponse.json(
      { error: "Credential not found" },
      { status: 404 },
    );
  }

  const challenge = req.cookies.get("passkey_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
  }

  const rpID = process.env.PASSKEY_RP_ID || "localhost";

  let verification;
  try {
    verification = await simpleWebAuthn.verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: req.headers.get("origin") || `https://${rpID}`,
      expectedRPID: rpID,
      authenticator: {
        credentialID: dbCredential.credentialId,
        credentialPublicKey: Buffer.from(dbCredential.publicKey, "base64"),
        counter: dbCredential.counter,
        transports: dbCredential.transports.split(","),
      },
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  // Update counter
  await prisma.passkeyCredential.update({
    where: { id: dbCredential.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  });

  // Create session token
  const { createAccessToken } = await import("@/lib/auth");
  const accessToken = await createAccessToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  response.cookies.delete("passkey_challenge");

  return response;
}

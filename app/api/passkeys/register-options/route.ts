import { getUserFromToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// NOTE: Install `@simplewebauthn/server` to enable passkeys:
// npm install @simplewebauthn/server
// Also generate a RP_ID and RP_NAME env vars.

let simpleWebAuthn: any = null;
try {
  simpleWebAuthn = require("@simplewebauthn/server");
} catch {
  simpleWebAuthn = null;
}

export async function GET(req: NextRequest) {
  if (!simpleWebAuthn) {
    return NextResponse.json(
      {
        error:
          "Passkeys not configured. Run: npm install @simplewebauthn/server",
      },
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

  const rpID = process.env.PASSKEY_RP_ID || "localhost";
  const rpName = process.env.PASSKEY_RP_NAME || "Ekantah";

  const options = await simpleWebAuthn.generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Store challenge temporarily (in production use Redis or encrypted cookie)
  // For simplicity, we return it in a short-lived cookie
  const response = NextResponse.json(options);
  response.cookies.set("passkey_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  });

  return response;
}

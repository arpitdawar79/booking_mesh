"use client";

import { useCallback, useEffect, useState } from "react";

export function usePasskeys() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable === "function";
    setIsSupported(supported);
  }, []);

  const register = useCallback(async () => {
    if (!isSupported) {
      setError("Passkeys are not supported on this device");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/passkeys/register-options");
      if (!res.ok) throw new Error(await res.text());
      const options = await res.json();

      options.user.id = base64UrlToBuffer(options.user.id);
      options.challenge = base64UrlToBuffer(options.challenge);
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(
          (cred: any) => ({
            ...cred,
            id: base64UrlToBuffer(cred.id),
          }),
        );
      }

      const credential = await navigator.credentials.create({
        publicKey: options,
      });
      if (!credential) throw new Error("No credential created");

      const registerRes = await fetch("/api/passkeys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          credentialToJSON(credential as PublicKeyCredential),
        ),
      });
      if (!registerRes.ok) throw new Error(await registerRes.text());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const login = useCallback(
    async (email: string) => {
      if (!isSupported) {
        setError("Passkeys are not supported on this device");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/passkeys/login-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error(await res.text());
        const options = await res.json();

        options.challenge = base64UrlToBuffer(options.challenge);
        if (options.allowCredentials) {
          options.allowCredentials = options.allowCredentials.map(
            (cred: any) => ({
              ...cred,
              id: base64UrlToBuffer(cred.id),
            }),
          );
        }

        const credential = await navigator.credentials.get({
          publicKey: options,
        });
        if (!credential) throw new Error("No credential selected");

        const loginRes = await fetch("/api/passkeys/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            credential: credentialToJSON(credential as PublicKeyCredential),
          }),
        });
        if (!loginRes.ok) throw new Error(await loginRes.text());

        window.location.href = "/dashboard";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      } finally {
        setLoading(false);
      }
    },
    [isSupported],
  );

  return { isSupported, loading, error, register, login };
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function credentialToJSON(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse;
  const json: any = {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
    response: {},
  };

  if (response.clientDataJSON) {
    json.response.clientDataJSON = bufferToBase64Url(response.clientDataJSON);
  }
  if ("attestationObject" in response) {
    json.response.attestationObject = bufferToBase64Url(
      (response as any).attestationObject,
    );
  }
  if ("authenticatorData" in response) {
    json.response.authenticatorData = bufferToBase64Url(
      (response as any).authenticatorData,
    );
  }
  if ("signature" in response) {
    json.response.signature = bufferToBase64Url((response as any).signature);
  }
  if ("userHandle" in response && (response as any).userHandle) {
    json.response.userHandle = bufferToBase64Url((response as any).userHandle);
  }

  return json;
}

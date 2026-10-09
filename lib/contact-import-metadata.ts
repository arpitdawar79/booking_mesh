import { isIP } from "node:net";
import type { ImportContext } from "./contact-import-context";

const ipHeaders = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"] as const;

export function buildImportMetadata(
  headers: Headers,
  context?: ImportContext,
  configuredIpHeader?: string,
  now = new Date(),
) {
  // Proxy configuration is an operator assertion, not proof of the header's identity.
  // A configured header must be overwritten by an ingress that blocks direct access.
  const configured = ipHeaders.find((header) => header === configuredIpHeader);
  const candidates = configured ? [configured] : ipHeaders;
  let ip: string | null = null;
  let header: string | null = null;
  for (const candidate of candidates) {
    const value = headers.get(candidate)?.split(",")[0].trim();
    if (value && isIP(value)) {
      ip = value;
      header = candidate;
      break;
    }
  }
  const mobileHint = headers.get("sec-ch-ua-mobile");
  return {
    schemaVersion: 1,
    channel: "phone_book",
    method: context?.method ?? "unspecified",
    files: context?.files ?? [],
    capturedAt: now.toISOString(),
    device: context?.device ?? null,
    browser: {
      userAgent: headers.get("user-agent")?.slice(0, 1024) ?? null,
      platform: headers.get("sec-ch-ua-platform")?.slice(0, 100) ?? null,
      mobile: mobileHint === "?1" ? true : mobileHint === "?0" ? false : null,
    },
    network: {ip, header, trust: ip ? (configured ? "configured_proxy_header" : "unverified_header") : "unavailable"},
  };
}

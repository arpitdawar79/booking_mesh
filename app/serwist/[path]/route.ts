import { createSerwistRoute } from "@serwist/turbopack";
import { spawnSync } from "node:child_process";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim() ||
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/~offline", revision },
      { url: "/manifest.webmanifest", revision },
    ],
    globIgnores: [
      "**/node_modules/**/*",
      "**/logs/**/*",
      "**/whatsapp_auth/**/*",
      "**/.git/**/*",
      "**/*.nft.json",
      "**/*.map",
    ],
    globPatterns: [
      ".next/static/**/*.{js,css,woff,woff2}",
      "public/**/*.{ico,png,svg,webmanifest}",
    ],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });

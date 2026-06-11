"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentPropsWithoutRef, type ReactNode, useRef } from "react";

interface SmartLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, "href"> {
  href: string;
  children: ReactNode;
}

export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  const router = useRouter();
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    // Prefetch on touchstart for an immediate head-start before click fires.
    // Next.js router.prefetch is idempotent and lightweight.
    if (typeof window !== "undefined" && "ontouchstart" in window) {
      router.prefetch(href);
    }
  };

  const handleTouchEnd = () => {
    // Clear any pending prefetch timeout on touch end
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  };

  return (
    <Link
      href={href}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </Link>
  );
}

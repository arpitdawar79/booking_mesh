"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

/* ─── Haptic Feedback ─── */

export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    if (typeof window === "undefined" || !navigator.vibrate) return;
    const patterns: Record<HapticPattern, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      success: [20, 40, 20],
      warning: [30, 60, 30],
      error: [40, 80, 40, 80, 40],
    };
    navigator.vibrate(patterns[pattern]);
  }, []);
  return vibrate;
}

/* ─── Standalone Mode ─── */

export function useStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [displayMode, setDisplayMode] = useState<string>("browser");

  useEffect(() => {
    const check = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator &&
          (window.navigator as Navigator & { standalone?: boolean })
            .standalone === true);
      setIsStandalone(standalone);

      const mode =
        (window.matchMedia("(display-mode: fullscreen)").matches &&
          "fullscreen") ||
        (window.matchMedia("(display-mode: standalone)").matches &&
          "standalone") ||
        (window.matchMedia("(display-mode: minimal-ui)").matches &&
          "minimal-ui") ||
        "browser";
      setDisplayMode(mode);
    };

    check();
    const mql = window.matchMedia("(display-mode: standalone)");
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, []);

  return { isStandalone, displayMode };
}

/* ─── Network State ─── */

export function useNetworkState() {
  const [online, setOnline] = useState(true);
  const [effectiveType, setEffectiveType] = useState<string>("4g");
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      const conn = (navigator as any).connection;
      if (conn) {
        setEffectiveType(conn.effectiveType || "4g");
        setSaveData(!!conn.saveData);
      }
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      if (conn) conn.removeEventListener("change", update);
    };
  }, []);

  return { online, effectiveType, saveData };
}

/* ─── Install Prompt ─── */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage(
    "stream-pwa-install-dismissed",
    false,
  );

  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true);

    setInstalled(checkStandalone());
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
    );

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setCanInstall(false);
      setInstalled(true);
      setPrompt(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [setDismissed]);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome !== "accepted") {
      setDismissed(true);
    }
    setPrompt(null);
    setCanInstall(false);
  }, [prompt, setDismissed]);

  return { canInstall, installed, install, isIOS, dismissed, setDismissed };
}

/* ─── Scroll Direction (hide/show header) ─── */

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const lastScrollY = useRef(0);

  useEffect(() => {
    const update = () => {
      const current = window.scrollY;
      setScrollDirection(
        current > lastScrollY.current && current > 60 ? "down" : "up",
      );
      lastScrollY.current = current;
    };

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return scrollDirection;
}

/* ─── Touch Feedback (ripple) ─── */

export function useTouchFeedback() {
  const haptic = useHaptic();

  const onTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.transform = "scale(0.97)";
      target.style.transition = "transform 80ms ease";
      haptic("light");
    },
    [haptic],
  );

  const onTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.transform = "scale(1)";
    setTimeout(() => {
      target.style.transition = "";
    }, 150);
  }, []);

  return { onTouchStart, onTouchEnd };
}

export function useLongPress(
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void,
  onClick?: (e: React.TouchEvent | React.MouseEvent) => void,
  ms = 500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      isLongPress.current = false;
      timerRef.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(e);
      }, ms);
    },
    [onLongPress, ms],
  );

  const end = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!isLongPress.current && onClick) {
        onClick(e);
      }
      isLongPress.current = false;
    },
    [onClick],
  );

  const move = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: end,
    onTouchMove: move,
    onMouseDown: start,
    onMouseUp: end,
    onMouseMove: move,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

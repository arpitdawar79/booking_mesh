"use client";

import { useHaptic, useInstallPrompt } from "@/lib/pwa-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function InstallPrompt() {
  const { canInstall, installed, install, isIOS, dismissed, setDismissed } =
    useInstallPrompt();
  const haptic = useHaptic();
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    haptic("light");
    setDismissed(true);
  };

  const handleInstall = () => {
    haptic("medium");
    if (canInstall) {
      install();
    } else {
      router.push("/dashboard/install");
    }
  };

  const handleLearnMore = () => {
    haptic("light");
    router.push("/dashboard/install");
  };

  if (!show || installed || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-x-4 bottom-4 z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:bottom-6"
      >
        <div className="mx-auto max-w-[360px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold">Add to Home Screen</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Get the full app experience with offline access
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-muted transition -mr-1 -mt-1"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {isIOS ? (
            <div className="mt-4 p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-medium text-foreground mb-3">
                Follow these steps:
              </p>
              <ol className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Share2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>
                    Tap the{" "}
                    <span className="text-foreground font-medium">Share</span>{" "}
                    button
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary font-bold mt-0.5 w-4 shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap{" "}
                    <span className="text-foreground font-medium">
                      Add to Home Screen
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary font-bold mt-0.5 w-4 shrink-0">
                    3
                  </span>
                  <span>
                    Tap <span className="text-foreground font-medium">Add</span>{" "}
                    to confirm
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background h-12 text-sm font-semibold active:scale-[0.98] transition-all hover:bg-foreground/90"
            >
              <Download className="h-4 w-4" />
              {canInstall ? "Install App" : "See Instructions"}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

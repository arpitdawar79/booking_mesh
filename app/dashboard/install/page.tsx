"use client";

import { useInstallPrompt } from "@/lib/pwa-hooks";
import { motion } from "framer-motion";
import {
  Apple,
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Info,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DeviceType = "ios" | "android" | "desktop";

export default function InstallPage() {
  const router = useRouter();
  const { canInstall, install, isIOS, installed } = useInstallPrompt();
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType("ios");
    } else if (/android/.test(ua)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  if (installed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">App Already Installed</h1>
          <p className="text-muted-foreground mb-6">
            The Stream is already installed on your device. Open it from your
            home screen to use it.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl bg-foreground text-background py-3 font-semibold hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go back
        </button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Install The Stream</h1>
          <p className="text-muted-foreground">
            Get the full app experience with offline access
          </p>
        </motion.div>

        {deviceType === "android" && canInstall && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <button
              onClick={install}
              className="w-full flex items-center justify-center gap-3 bg-foreground text-background h-14 rounded-2xl text-lg font-semibold active:scale-[0.98] transition-all hover:bg-foreground/90"
            >
              <Download className="h-5 w-5" />
              Install App Now
            </button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              Tap above to install • It&apos;s free!
            </p>
          </motion.div>
        )}

        {deviceType === "android" && !canInstall && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="bg-muted/50 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Manual Installation</h3>
                  <p className="text-sm text-muted-foreground">
                    The automatic install isn&apos;t available right now. Follow
                    these steps:
                  </p>
                </div>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong>menu</strong> button (three dots) in the top
                    right
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>
                    Select <strong>&quot;Add to Home Screen&quot;</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> to confirm
                  </span>
                </li>
              </ol>
            </div>
          </motion.div>
        )}

        {deviceType === "ios" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="bg-muted/50 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <Apple className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">
                    iPhone / iPad Installation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Follow these simple steps to add to your home screen:
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-sm">Tap the Share button</p>
                    <p className="text-xs text-muted-foreground">
                      It&apos;s the square with an arrow pointing up, at the
                      bottom of the screen
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      Scroll down and tap &quot;Add to Home Screen&quot;
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You may need to scroll down to see it
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      Tap &quot;Add&quot; in the top right
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The app will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {deviceType === "desktop" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="bg-muted/50 rounded-2xl p-6">
              <h3 className="font-semibold mb-3">Desktop Installation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To install The Stream on your computer:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>
                    Open this page in <strong>Chrome</strong>,{" "}
                    <strong>Edge</strong>, or <strong>Brave</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>
                    Look for the install icon in the address bar (right side)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>Click it to install as a desktop app</span>
                </li>
              </ol>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  💡 Tip: You can also press{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    Ctrl
                  </kbd>{" "}
                  +{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    Shift
                  </kbd>{" "}
                  +{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    I
                  </kbd>{" "}
                  to open on mobile
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl border border-border py-3 font-semibold hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Continue to Dashboard
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Installed apps work offline and load faster
        </p>
      </div>
    </div>
  );
}

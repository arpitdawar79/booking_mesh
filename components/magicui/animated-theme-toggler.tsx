"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star";

type ThemeMode = "light" | "dark" | "system";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  variant?: TransitionVariant;
  /** When true, the transition expands from the viewport center instead of the button center. */
  fromCenter?: boolean;
  /**
   * Controlled theme value. When provided, the parent owns persistence
   * (e.g. `next-themes`) and this component will not write to localStorage.
   */
  theme?: ThemeMode;
  /** Called on toggle. Pair with `theme` for controlled usage. */
  onThemeChange?: (theme: ThemeMode) => void;
}

function polygonCollapsed(cx: number, cy: number, vertexCount: number): string {
  const pairs = Array.from(
    { length: vertexCount },
    () => `${cx}px ${cy}px`,
  ).join(", ");
  return `polygon(${pairs})`;
}

function getThemeTransitionClipPaths(
  variant: TransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number,
): [string, string] {
  switch (variant) {
    case "circle":
      return [
        `circle(0px at ${cx}px ${cy}px)`,
        `circle(${maxRadius}px at ${cx}px ${cy}px)`,
      ];
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const halfSide = Math.max(halfW, halfH) * 1.05;
      const end = [
        `${cx - halfSide}px ${cy - halfSide}px`,
        `${cx + halfSide}px ${cy - halfSide}px`,
        `${cx + halfSide}px ${cy + halfSide}px`,
        `${cx - halfSide}px ${cy + halfSide}px`,
      ].join(", ");
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`];
    }
    case "triangle": {
      const scale = maxRadius * 2.2;
      const dx = (Math.sqrt(3) / 2) * scale;
      const verts = [
        `${cx}px ${cy - scale}px`,
        `${cx + dx}px ${cy + 0.5 * scale}px`,
        `${cx - dx}px ${cy + 0.5 * scale}px`,
      ].join(", ");
      return [polygonCollapsed(cx, cy, 3), `polygon(${verts})`];
    }
    case "diamond": {
      // Slightly larger than the view-transition circle radius so axis-aligned coverage matches the circle reveal.
      const R = maxRadius * Math.SQRT2;
      const end = [
        `${cx}px ${cy - R}px`,
        `${cx + R}px ${cy}px`,
        `${cx}px ${cy + R}px`,
        `${cx - R}px ${cy}px`,
      ].join(", ");
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`];
    }
    case "hexagon": {
      const R = maxRadius * Math.SQRT2;
      const verts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        verts.push(`${cx + R * Math.cos(a)}px ${cy + R * Math.sin(a)}px`);
      }
      return [polygonCollapsed(cx, cy, 6), `polygon(${verts.join(", ")})`];
    }
    case "rectangle": {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const end = [
        `${cx - halfW}px ${cy - halfH}px`,
        `${cx + halfW}px ${cy - halfH}px`,
        `${cx + halfW}px ${cy + halfH}px`,
        `${cx - halfW}px ${cy + halfH}px`,
      ].join(", ");
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`];
    }
    case "star": {
      // Small overscan so the last frames never leave a 1px seam before the transition group ends.
      const R = maxRadius * Math.SQRT2 * 1.03;
      const innerRatio = 0.42;
      const starPolygon = (radius: number) => {
        const verts: string[] = [];
        for (let i = 0; i < 5; i++) {
          const outerA = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          verts.push(
            `${cx + radius * Math.cos(outerA)}px ${cy + radius * Math.sin(outerA)}px`,
          );
          const innerA = outerA + Math.PI / 5;
          verts.push(
            `${cx + radius * innerRatio * Math.cos(innerA)}px ${cy + radius * innerRatio * Math.sin(innerA)}px`,
          );
        }
        return `polygon(${verts.join(", ")})`;
      };
      const startR = Math.max(2, R * 0.025);
      return [starPolygon(startR), starPolygon(R)];
    }
    default:
      return [
        `circle(0px at ${cx}px ${cy}px)`,
        `circle(${maxRadius}px at ${cx}px ${cy}px)`,
      ];
  }
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  variant,
  fromCenter = false,
  theme,
  onThemeChange,
  ...props
}: AnimatedThemeTogglerProps) => {
  const shape = variant ?? "circle";
  const isControlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme: ThemeMode = theme ?? "system";
  const isSystem = currentTheme === "system";

  const getSystemTheme = useCallback(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }, []);

  const resolvedTheme = isSystem ? getSystemTheme() : currentTheme;
  const isDark = isControlled ? resolvedTheme === "dark" : internalIsDark;
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isControlled) return;

    const updateTheme = () => {
      setInternalIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [isControlled]);

  const handleSelect = useCallback(
    (newTheme: ThemeMode) => {
      const button = buttonRef.current;
      if (!button) return;

      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;

      let x: number;
      let y: number;
      if (fromCenter) {
        x = viewportWidth / 2;
        y = viewportHeight / 2;
      } else {
        const { top, left, width, height } = button.getBoundingClientRect();
        x = left + width / 2;
        y = top + height / 2;
      }

      const maxRadius = Math.hypot(
        Math.max(x, viewportWidth - x),
        Math.max(y, viewportHeight - y),
      );

      const applyTheme = () => {
        const resolvedNew = newTheme === "system" ? getSystemTheme() : newTheme;
        const shouldBeDark = resolvedNew === "dark";
        const currentlyDark =
          document.documentElement.classList.contains("dark");

        if (shouldBeDark !== currentlyDark) {
          document.documentElement.classList.toggle("dark");
        }

        if (isControlled) {
          onThemeChange?.(newTheme);
        } else {
          setInternalIsDark(shouldBeDark);
          localStorage.setItem("theme", newTheme);
        }
      };

      const performTransition = () => {
        if (typeof document.startViewTransition !== "function") {
          applyTheme();
          return;
        }

        const clipPath = getThemeTransitionClipPaths(
          shape,
          x,
          y,
          maxRadius,
          viewportWidth,
          viewportHeight,
        );

        const root = document.documentElement;
        root.dataset.magicuiThemeVt = "active";
        root.style.setProperty(
          "--magicui-theme-toggle-vt-duration",
          `${duration}ms`,
        );
        root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);
        const cleanup = () => {
          delete root.dataset.magicuiThemeVt;
          root.style.removeProperty("--magicui-theme-toggle-vt-duration");
          root.style.removeProperty("--magicui-theme-vt-clip-from");
        };

        const transition = document.startViewTransition(() => {
          flushSync(applyTheme);
        });
        if (typeof transition?.finished?.finally === "function") {
          transition.finished.finally(cleanup);
        } else {
          cleanup();
        }

        const ready = transition?.ready;
        if (ready && typeof ready.then === "function") {
          ready.then(() => {
            document.documentElement.animate(
              {
                clipPath,
              },
              {
                duration,
                easing: shape === "star" ? "linear" : "ease-in-out",
                fill: "forwards",
                pseudoElement: "::view-transition-new(root)",
              },
            );
          });
        }
      };

      performTransition();
      setIsOpen(false);
    },
    [shape, fromCenter, duration, isControlled, onThemeChange, getSystemTheme],
  );

  const toggleTheme = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, []);

  const themeOptions: {
    value: ThemeMode;
    label: string;
    icon: React.ReactNode;
    shortLabel: string;
  }[] = [
    {
      value: "system",
      label: "System",
      shortLabel: "Auto",
      icon: <Monitor className="h-3.5 w-3.5" />,
    },
    {
      value: "light",
      label: "Light",
      shortLabel: "Light",
      icon: <Sun className="h-3.5 w-3.5" />,
    },
    {
      value: "dark",
      label: "Dark",
      shortLabel: "Dark",
      icon: <Moon className="h-3.5 w-3.5" />,
    },
  ];

  const currentOption = themeOptions.find((opt) => opt.value === currentTheme);

  return (
    <div className="relative">
      <button
        type="button"
        ref={buttonRef}
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex items-center justify-center gap-1.5 rounded-xl transition-all duration-300",
          "h-9 px-2.5",
          "bg-secondary/60 hover:bg-secondary dark:bg-secondary/30 dark:hover:bg-secondary/50",
          "border border-border/60 hover:border-border",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:ring-offset-background",
          className,
        )}
        {...props}
      >
        <span className="relative flex items-center justify-center">
          <span
            className={cn(
              "absolute inset-0 rounded-lg transition-all duration-300",
              isDark
                ? "bg-primary/10 scale-100 opacity-100"
                : "bg-primary/5 scale-100 opacity-100",
            )}
          />
          <span className="relative flex items-center gap-1.5">
            {currentOption?.icon}
            <span className="text-[11px] font-semibold tracking-wide text-foreground hidden sm:inline leading-none">
              {currentOption?.shortLabel}
            </span>
          </span>
        </span>
        <span className="sr-only">Toggle theme</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-border/50 bg-popover/95 backdrop-blur-md p-1 shadow-lg",
              "animate-in fade-in zoom-in-95 duration-200",
              "dark:shadow-primary/5",
              "min-w-32",
            )}
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "group relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all duration-200",
                  currentTheme === option.value
                    ? "bg-primary/10 text-primary dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200",
                    currentTheme === option.value
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                  )}
                >
                  {option.icon}
                </span>
                <span className="font-medium">{option.label}</span>
                {currentTheme === option.value && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center">
                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

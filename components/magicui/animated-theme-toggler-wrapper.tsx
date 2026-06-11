"use client";

import { AnimatedThemeToggler, type TransitionVariant } from "./animated-theme-toggler";
import { useTheme } from "@/lib/theme-context";

interface AnimatedThemeTogglerWrapperProps {
  variant?: TransitionVariant;
  duration?: number;
  fromCenter?: boolean;
  className?: string;
}

export function AnimatedThemeTogglerWrapper({
  variant,
  duration,
  fromCenter,
  className,
}: AnimatedThemeTogglerWrapperProps) {
  const { theme, setTheme } = useTheme();

  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      variant={variant}
      duration={duration}
      fromCenter={fromCenter}
      className={className}
    />
  );
}

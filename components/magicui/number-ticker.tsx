"use client";

import NumberFlow from "@number-flow/react";
import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface NumberTickerProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatOptions?: Parameters<typeof NumberFlow>[0]["format"];
}

export function NumberTicker({
  value,
  className = "",
  prefix = "",
  suffix = "",
  formatOptions,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      setDisplayValue(value);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <NumberFlow
        value={displayValue}
        format={formatOptions}
        transformTiming={{
          duration: 1200,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        spinTiming={{ duration: 800, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      {suffix}
    </span>
  );
}

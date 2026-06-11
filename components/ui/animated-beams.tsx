"use client";

import { useEffect, useState, RefObject, useId } from "react";
import { motion } from "framer-motion";

interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  duration?: number;
  delay?: number;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  strokeWidth?: number;
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  duration = 3,
  delay = 0,
  pathColor = "var(--border)",
  pathWidth = 1.5,
  pathOpacity = 0.25,
  gradientStartColor = "#14b8a6",
  gradientStopColor = "#8b5cf6",
  strokeWidth = 2,
}: AnimatedBeamProps) {
  const [path, setPath] = useState("");
  const uniqueId = useId().replace(/:/g, "");
  const gradId = `beam-grad-${uniqueId}`;

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const fromRect = fromRef.current.getBoundingClientRect();
      const toRect = toRef.current.getBoundingClientRect();

      const startX = fromRect.left - containerRect.left + fromRect.width / 2;
      const startY = fromRect.top - containerRect.top + fromRect.height / 2;
      const endX = toRect.left - containerRect.left + toRect.width / 2;
      const endY = toRect.top - containerRect.top + toRect.height / 2;

      if (curvature === 0) {
        setPath(`M ${startX} ${startY} L ${endX} ${endY}`);
      } else {
        const controlX = (startX + endX) / 2;
        const controlY = (startY + endY) / 2 - curvature;
        setPath(`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
      }
    };

    updatePath();

    const resizeObserver = new ResizeObserver(updatePath);
    if (fromRef.current) resizeObserver.observe(fromRef.current);
    if (toRef.current) resizeObserver.observe(toRef.current);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", updatePath);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePath);
    };
  }, [containerRef, fromRef, toRef, curvature]);

  if (!path) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {/* Static track */}
      <path
        d={path}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        fill="none"
      />

      {/* Light pulse beam */}
      <motion.path
        d={path}
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        initial={{ strokeDasharray: "15 50", strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -65 }}
        transition={{
          repeat: Infinity,
          duration: duration,
          ease: "linear",
          delay: delay,
        }}
      />

      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="30%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="70%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

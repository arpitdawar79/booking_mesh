"use client";

import React, { useRef } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beams";
import { User, Server, Mail, Smartphone, BarChart3 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";

export function WorkflowShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HTMLDivElement>(null);
  const waRef = useRef<HTMLDivElement>(null);
  const mailRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  return (
    <MagicCard className="p-4 sm:p-5 overflow-visible" borderBeam backlight>
      <div className="space-y-4 relative" ref={containerRef}>
        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/80">
            Booking & Notification Pipeline
          </h3>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Real-time visual flow showing how booking inquiries prompt notification dispatches and feed analytics.
          </p>
        </div>

        {/* Nodes layout grid */}
        <div className="flex items-center justify-between min-h-[160px] relative z-10 py-3 px-1 sm:px-8">
          {/* Guest Node (Left) */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              ref={userRef}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card/60 border border-border flex items-center justify-center text-teal-400 shadow-md relative z-10 group-hover:scale-105 transition-transform"
              title="Guest Booking Request"
            >
              <User className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-wider">Guest</span>
          </div>

          {/* Engine Nodes (Center) */}
          <div className="flex flex-col items-center gap-5 sm:gap-7">
            {/* Core Engine */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                ref={engineRef}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg relative z-10 group-hover:scale-105 transition-transform"
                title="Core Booking Engine"
              >
                <Server className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
              <span className="text-[9px] font-bold text-teal-400/80 uppercase tracking-wider">Core Engine</span>
            </div>

            {/* Analytics Dashboard (Bottom) */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                ref={statsRef}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card/60 border border-border flex items-center justify-center text-indigo-400 shadow-md relative z-10 group-hover:scale-105 transition-transform"
                title="Analytics Metrics"
              >
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-wider">Analytics</span>
            </div>
          </div>

          {/* Output Nodes (Right) */}
          <div className="flex flex-col gap-5 sm:gap-7">
            {/* WhatsApp Node */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider hidden md:inline">WhatsApp Dispatch</span>
              <div
                ref={waRef}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card/60 border border-border flex items-center justify-center text-emerald-400 shadow-md relative z-10 group-hover:scale-105 transition-transform"
                title="WhatsApp Notification System"
              >
                <Smartphone className="w-5 h-5" />
              </div>
            </div>

            {/* Email Node */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider hidden md:inline">SMTP Layouts</span>
              <div
                ref={mailRef}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card/60 border border-border flex items-center justify-center text-violet-400 shadow-md relative z-10 group-hover:scale-105 transition-transform"
                title="SMTP Email Layouts"
              >
                <Mail className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Connectors */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={userRef}
          toRef={engineRef}
          curvature={0}
          duration={3.5}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={engineRef}
          toRef={waRef}
          curvature={-20}
          duration={2.8}
          gradientStartColor="#14b8a6"
          gradientStopColor="#10b981"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={engineRef}
          toRef={mailRef}
          curvature={20}
          duration={2.8}
          gradientStartColor="#14b8a6"
          gradientStopColor="#8b5cf6"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={engineRef}
          toRef={statsRef}
          curvature={0}
          duration={4}
          gradientStartColor="#14b8a6"
          gradientStopColor="#6366f1"
        />
      </div>
    </MagicCard>
  );
}

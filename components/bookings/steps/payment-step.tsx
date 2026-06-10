"use client";

import { Input, Select, StepCard } from "@/components/ui/form-primitives";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { CircleDollarSign, Landmark, ShieldCheck } from "lucide-react";

interface Props {
  totalAmount: string;
  setTotalAmount: (v: string) => void;
  amountPaidOnline: string;
  setAmountPaidOnline: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  onEnter: (() => void) | undefined;
}

export function PaymentStep({
  totalAmount,
  setTotalAmount,
  amountPaidOnline,
  setAmountPaidOnline,
  currency,
  setCurrency,
  onEnter,
}: Props) {
  const total = Number(totalAmount || 0);
  const paid = Number(amountPaidOnline || 0);
  const balance = Math.max(0, total - paid);
  const isFullyPaid = paid >= total && total > 0;

  return (
    <StepCard
      icon={<CircleDollarSign className="w-5 h-5" />}
      title="Payment details"
      subtitle="How much and how paid?"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Total Amount *"
            value={totalAmount}
            onChange={setTotalAmount}
            placeholder="e.g. 15000"
            type="number"
            onEnter={onEnter}
          />
          <Input
            label="Paid Online"
            value={amountPaidOnline}
            onChange={setAmountPaidOnline}
            placeholder="0"
            type="number"
          />
        </div>

        {/* Financial Summary panel */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#0d0d0d]/50 p-5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-teal-500/4 via-transparent to-emerald-500/2 pointer-events-none" />

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground/70">
              Receipt Overview
            </h3>
            {isFullyPaid ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded-xl px-2.5 py-1 flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Fully Settled
              </span>
            ) : total > 0 && paid > 0 ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/15 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                Partially Paid
              </span>
            ) : null}
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground/60 font-semibold">
                Total Invoice
              </span>
              <span className="font-extrabold text-foreground flex items-center gap-1">
                <span className="text-xs text-muted-foreground/40 font-bold">
                  {currency}
                </span>
                <NumberFlow value={total} />
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground/60 font-semibold">
                Online Advanced
              </span>
              <span className="font-extrabold text-teal-400 flex items-center gap-1">
                <span className="text-xs text-teal-500/40 font-bold">
                  {currency}
                </span>
                <NumberFlow value={paid} />
              </span>
            </div>

            <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/70">
                Balance Due
              </span>
              <span
                className={cn(
                  "text-lg font-black tracking-tight flex items-center gap-1",
                  balance > 0 ? "text-orange-400" : "text-emerald-400",
                )}
              >
                <span className="text-xs font-bold opacity-50">{currency}</span>
                <NumberFlow value={balance} />
              </span>
            </div>
          </div>
        </div>

        <Select
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={["INR", "USD", "EUR"]}
        />
      </div>
    </StepCard>
  );
}

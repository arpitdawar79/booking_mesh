"use client";

import { Input, Select, StepCard } from "@/components/ui/form-primitives";
import { CircleDollarSign } from "lucide-react";

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

  return (
    <StepCard icon={<CircleDollarSign className="w-5 h-5" />} title="Payment" subtitle="How much and how paid?">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Total Amount *" value={totalAmount} onChange={setTotalAmount} placeholder="e.g. 15000" type="number" autoFocus onEnter={onEnter} />
          <Input label="Paid Online" value={amountPaidOnline} onChange={setAmountPaidOnline} placeholder="0" type="number" />
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
          <h3 className="text-sm font-semibold">Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{currency} {total.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid Online</span>
            <span className="font-medium">{currency} {paid.toLocaleString("en-IN")}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium">{currency} {balance.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <Select label="Currency" value={currency} onChange={setCurrency} options={["INR", "USD", "EUR"]} />
      </div>
    </StepCard>
  );
}

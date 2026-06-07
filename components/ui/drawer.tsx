"use client";

import { cn } from "@/lib/utils";
import { Drawer as VaulDrawer } from "vaul";

export function Drawer({
  children,
  open,
  onOpenChange,
  className,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </VaulDrawer.Root>
  );
}

export function DrawerTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  return <VaulDrawer.Trigger asChild={asChild}>{children}</VaulDrawer.Trigger>;
}

export function DrawerContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <VaulDrawer.Portal>
      <VaulDrawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60" />
      <VaulDrawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-70 mt-24 flex h-[80dvh] flex-col rounded-t-2xl border border-border bg-background",
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </VaulDrawer.Content>
    </VaulDrawer.Portal>
  );
}

export function DrawerTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <VaulDrawer.Title className={cn("text-lg font-semibold", className)}>
      {children}
    </VaulDrawer.Title>
  );
}

export function DrawerDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <VaulDrawer.Description
      className={cn("text-sm text-muted-foreground", className)}
    >
      {children}
    </VaulDrawer.Description>
  );
}

"use client";

import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
} from "@/components/ui/drawer";
import { DayData } from "./day-cell";
import { DayDetailContent } from "./day-detail-content";

interface DayDetailDrawerProps {
  day: DayData | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DayDetailDrawer({
  day,
  isOpen,
  onClose,
}: DayDetailDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="space-y-1 mb-4">
          <DrawerTitle>{day ? formatDate(day.date) : ""}</DrawerTitle>
          <DrawerDescription>Daily performance details</DrawerDescription>
        </div>
        {day && <DayDetailContent day={day} />}
      </DrawerContent>
    </Drawer>
  );
}

import { SalarySlipEmail } from "@/emails/salary-slip-email";
import type { Booking } from "@prisma/client";
import React from "react";
import { renderEmailHtml, type EmailType } from "./email";

export async function renderBookingPdfHtml(
  type: string,
  booking: Booking,
  customMessage?: string,
): Promise<string> {
  return renderEmailHtml(type as EmailType, booking, customMessage);
}

export interface SalarySlipPdfData {
  employeeName: string;
  designation: string;
  phone?: string | null;
  month: string;
  year: number;
  daysWorked: number;
  totalDays: number;
  basicSalary: string;
  overtimeDays: number;
  overtimeRate: string;
  overtimeAmount: string;
  allowance: string;
  deduction: string;
  deductionReason?: string | null;
  netSalary: string;
  paymentMethod: string;
  paymentDate?: string | null;
  notes?: string | null;
  employerName: string;
  employerAddress: string;
  employerPhone: string;
}

export async function renderSalarySlipPdfHtml(
  data: SalarySlipPdfData,
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const element = React.createElement(SalarySlipEmail, data);
  return renderToStaticMarkup(element);
}

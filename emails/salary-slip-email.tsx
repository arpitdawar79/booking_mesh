import React from "react";
import {
  EmailShell,
  EmailHeader,
  EmailSection,
  EmailFooter,
  DataRow,
  AmountRow,
  themes,
} from "./components";

interface Props {
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

export function SalarySlipEmail(props: Props) {
  const theme = themes.booking;

  return (
    <EmailShell theme={theme} title={`Salary Slip | ${props.month} ${props.year} | ${props.employeeName}`}>
      <EmailHeader theme={theme} badge="Salary Slip" bookingId={`${props.month} ${props.year}`} />

      {/* Employer Info */}
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 24 }}>
        <tr>
          <td style={{ textAlign: "center", paddingBottom: 16 }}>
            <div style={{ color: theme.headerTitle, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: "bold", lineHeight: "28px", letterSpacing: "0.5px" }}>
              {props.employerName}
            </div>
            <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "18px", marginTop: 4 }}>
              {props.employerAddress}
            </div>
            <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "18px" }}>
              {props.employerPhone}
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ background: theme.heroDividerBg, height: 1 }} />
        </tr>
      </table>

      {/* Employee & Period */}
      <EmailSection theme={theme} label="Employee Details" title={`${props.employeeName} — ${props.designation}`}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Employee Name" value={props.employeeName} />
          <DataRow theme={theme} label="Designation" value={props.designation} />
          {props.phone && <DataRow theme={theme} label="Phone" value={props.phone} />}
          <DataRow theme={theme} label="Salary Period" value={`${props.month} ${props.year}`} />
          <DataRow theme={theme} label="Days Worked" value={`${props.daysWorked} / ${props.totalDays}`} />
        </table>
      </EmailSection>

      {/* Earnings */}
      <EmailSection theme={theme} label="Earnings" title="Breakdown of earnings for the month.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <AmountRow theme={theme} label="Basic Salary" amount={`INR ${props.basicSalary}`} />
          {Number(props.overtimeAmount) > 0 && (
            <AmountRow
              theme={theme}
              label={`Overtime (${props.overtimeDays} days @ INR ${props.overtimeRate}/day)`}
              amount={`INR ${props.overtimeAmount}`}
            />
          )}
          {Number(props.allowance) > 0 && (
            <AmountRow theme={theme} label="Allowance" amount={`INR ${props.allowance}`} />
          )}
        </table>
      </EmailSection>

      {/* Deductions */}
      {(Number(props.deduction) > 0 || props.deductionReason) && (
        <EmailSection theme={theme} label="Deductions" title="Any deductions applied this month." variant="warm">
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
            <AmountRow theme={theme} label={props.deductionReason || "Deduction"} amount={`INR ${props.deduction}`} highlight />
          </table>
        </EmailSection>
      )}

      {/* Net Salary */}
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 8, marginBottom: 8 }}>
        <tr>
          <td style={{ background: theme.headerBg, border: `1px solid ${theme.sectionBorder}`, borderRadius: 14, padding: 20 }}>
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={{ color: theme.sectionLabel, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10, lineHeight: "14px", textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: "bold", paddingBottom: 8 }}>
                  Net Salary Payable
                </td>
              </tr>
              <tr>
                <td style={{ color: theme.amountHighlight, fontFamily: "Georgia, serif", fontSize: 28, fontWeight: "bold", lineHeight: "34px" }}>
                  INR {props.netSalary}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      {/* Payment Details */}
      <EmailSection theme={theme} label="Payment Details" title="Payment method and date.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Payment Method" value={props.paymentMethod.replace("_", " ").toUpperCase()} />
          {props.paymentDate && <DataRow theme={theme} label="Payment Date" value={props.paymentDate} />}
        </table>
        {props.notes && (
          <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: "20px", marginTop: 12, padding: 12, background: theme.cardBg, borderRadius: 8, border: `1px solid ${theme.sectionBorder}` }}>
            <strong>Note:</strong> {props.notes}
          </div>
        )}
      </EmailSection>

      {/* Declaration */}
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 8, marginBottom: 16 }}>
        <tr>
          <td style={{ color: theme.footerText, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, lineHeight: "18px", textAlign: "center", padding: "16px 12px", background: theme.cardBg, borderRadius: 10, border: `1px solid ${theme.cardBorder}` }}>
            This is a computer-generated salary slip and does not require a physical signature.
            <br />
            For any queries, please contact the management.
          </td>
        </tr>
      </table>

      <EmailFooter theme={theme}>
        <div style={{ color: theme.footerText, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: "22px" }}>
          {props.employerName} &middot; Tirthan Valley, Himachal Pradesh
        </div>
      </EmailFooter>
    </EmailShell>
  );
}

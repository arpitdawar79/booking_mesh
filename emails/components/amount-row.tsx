import React from "react";
import type { EmailTheme } from "./themes";

interface AmountRowProps {
  theme: EmailTheme;
  label: string;
  amount: string;
  highlight?: boolean;
}

export function AmountRow({ theme, label, amount, highlight }: AmountRowProps) {
  return (
    <tr>
      <td
        style={{
          borderBottom: `1px solid ${theme.sectionBorder}`,
          padding: "12px 0",
        }}
      >
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tr>
            <td>
              <div
                style={{
                  color: theme.amountLabel,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "24px",
                }}
              >
                {label}
              </div>
            </td>
            <td align="right">
              <div
                style={{
                  color: highlight ? theme.amountHighlight : theme.amountValue,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "24px",
                  fontWeight: highlight ? "bold" : "normal",
                }}
              >
                {highlight ? (
                  <span
                    style={{
                      background: theme.badgeBg,
                      padding: "2px 10px",
                      borderRadius: 10,
                      display: "inline-block",
                    }}
                  >
                    {amount}
                  </span>
                ) : (
                  amount
                )}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}

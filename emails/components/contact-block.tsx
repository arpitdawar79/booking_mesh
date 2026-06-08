import React from "react";
import type { EmailTheme } from "./themes";

interface ContactBlockProps {
  theme: EmailTheme;
  label?: string;
  children: React.ReactNode;
  variant?: "warm" | "cool" | "default";
}

export function ContactBlock({
  theme,
  label = "Stay in touch",
  children,
  variant = "warm",
}: ContactBlockProps) {
  return (
    <tr>
      <td style={{ padding: "8px 36px 8px" }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{
            background:
              variant === "warm"
                ? "#fbf1e6"
                : variant === "cool"
                  ? "#eef2f6"
                  : theme.sectionBg,
            border: `1px solid ${variant === "warm" ? "#e4d1b8" : variant === "cool" ? "#c9cdd9" : theme.sectionBorder}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <tr>
            <td style={{ padding: 24 }}>
              <div
                style={{
                  color: theme.sectionLabel,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 10,
                  lineHeight: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "1.4px",
                  fontWeight: "bold",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  color: theme.sectionBody,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "24px",
                  paddingTop: 10,
                }}
              >
                {children}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}

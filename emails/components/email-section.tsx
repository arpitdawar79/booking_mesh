import React from "react";
import type { EmailTheme } from "./themes";
import { SparkleDecoration } from "./sparkle-decoration";

interface EmailSectionProps {
  theme: EmailTheme;
  label: string;
  title: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "warm" | "cool" | "alert" | "success";
  padding?: string;
  topSpacing?: string;
  bottomSpacing?: string;
}

const variantBg: Record<string, string> = {
  default: "sectionBg",
  warm: "#fbf1e6",
  cool: "#eef2f6",
  alert: "#fff0f0",
  success: "#f0fff4",
};

const variantBorder: Record<string, string> = {
  default: "sectionBorder",
  warm: "#e4d1b8",
  cool: "#c9cdd9",
  alert: "#e4c1c1",
  success: "#c1e4c9",
};

export function EmailSection({
  theme,
  label,
  title,
  children,
  variant = "default",
  padding = "28px",
  topSpacing = "8px",
  bottomSpacing = "8px",
}: EmailSectionProps) {
  const bg = variant === "default" ? theme.sectionBg : variantBg[variant];
  const border = variant === "default" ? theme.sectionBorder : variantBorder[variant];

  return (
    <tr>
      <td style={{ padding: `${topSpacing} 36px ${bottomSpacing}` }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <tr>
            <td style={{ padding }}>
              {/* Section label pill */}
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 20,
                  display: "inline-block",
                  marginBottom: 10,
                }}
              >
                <tr>
                  <td style={{ padding: "4px 12px" }}>
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
                  </td>
                </tr>
              </table>

              {/* Section title */}
              <div
                style={{
                  color: theme.sectionTitle,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 22,
                  lineHeight: "28px",
                  fontWeight: "normal",
                  paddingTop: 4,
                  letterSpacing: "-0.2px",
                }}
              >
                {title}
              </div>

              {/* Content */}
              <div style={{ paddingTop: 14 }}>{children}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}

import React from "react";
import type { EmailTheme } from "./themes";

interface CTAButtonProps {
  theme: EmailTheme;
  href: string;
  label: string;
}

export function CTAButton({ theme, href, label }: CTAButtonProps) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      style={{ marginTop: 18 }}
    >
      <tr>
        <td
          style={{
            background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            borderRadius: 10,
            padding: 0,
            boxShadow: theme.ctaShadow,
          }}
        >
          <table role="presentation" cellPadding={0} cellSpacing={0}>
            <tr>
              <td style={{ padding: "14px 28px" }}>
                <a
                  href={href}
                  style={{
                    color: theme.ctaText,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: "bold",
                    textDecoration: "none",
                    display: "inline-block",
                    letterSpacing: "0.5px",
                  }}
                >
                  {label}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
}

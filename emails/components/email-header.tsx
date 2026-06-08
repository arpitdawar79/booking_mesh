import React from "react";
import type { EmailTheme } from "./themes";

interface EmailHeaderProps {
  theme: EmailTheme;
  badge: string;
  bookingId: string;
}

export function EmailHeader({ theme, badge, bookingId }: EmailHeaderProps) {
  return (
    <tr>
      <td style={{ background: theme.headerBg }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
        >
          <tr>
            <td style={{ padding: "28px 36px 24px" }}>
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
              >
                <tr>
                  <td valign="middle">
                    <img
                      src="https://thestream.ekantah.com/wp-content/uploads/2025/06/the-stream-full.svg"
                      width={188}
                      alt="The Stream by Ekantah"
                      style={{
                        display: "block",
                        maxWidth: 188,
                        height: "auto",
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))",
                      }}
                    />
                  </td>
                  <td valign="middle" align="right">
                    {/* MagicUI-style status badge */}
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      style={{
                        background: theme.badgeBg,
                        border: `1px solid ${theme.sectionBorder}`,
                        borderRadius: 20,
                        display: "inline-block",
                      }}
                    >
                      <tr>
                        <td style={{ padding: "6px 14px" }}>
                          <div
                            style={{
                              color: theme.badgeText,
                              fontFamily: "Arial, Helvetica, sans-serif",
                              fontSize: 10,
                              lineHeight: "14px",
                              textTransform: "uppercase",
                              letterSpacing: "1.4px",
                              fontWeight: "bold",
                            }}
                          >
                            {badge}
                          </div>
                        </td>
                      </tr>
                    </table>
                    <div
                      style={{
                        color: theme.headerId,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: "bold",
                        paddingTop: 8,
                        textAlign: "right",
                      }}
                    >
                      #{bookingId}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}

import React from "react";
import type { EmailTheme } from "./themes";

interface EmailFooterProps {
  theme: EmailTheme;
  children?: React.ReactNode;
}

export function EmailFooter({ theme, children }: EmailFooterProps) {
  return (
    <tr>
      <td style={{ padding: "32px 36px 36px" }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
        >
          <tr>
            <td
              style={{
                borderTop: `1px solid ${theme.footerBorder}`,
                paddingTop: 24,
              }}
            >
              {children || (
                <div
                  style={{
                    color: theme.footerText,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 13,
                    lineHeight: "22px",
                  }}
                >
                  The Stream by Ekantah &middot; Tirthan Valley, Himachal Pradesh
                </div>
              )}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}

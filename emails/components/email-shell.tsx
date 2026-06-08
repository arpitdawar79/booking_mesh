import React from "react";
import type { EmailTheme } from "./themes";

interface EmailShellProps {
  theme: EmailTheme;
  title: string;
  children: React.ReactNode;
}

export function EmailShell({ theme, title, children }: EmailShellProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root { color-scheme: light; }
              /* MagicUI-inspired subtle enhancements */
              .magic-card {
                border-radius: 16px;
                overflow: hidden;
              }
              .magic-glow {
                box-shadow: 0 8px 32px rgba(0,0,0,0.06);
              }
              .gradient-bar {
                background: linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientMid}, ${theme.gradientTo});
              }
              @media print {
                table, tr, td, div, img {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              }
            `,
          }}
        />
        <title>{title}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          background: theme.bodyBg,
          colorScheme: "light",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <center style={{ width: "100%", background: theme.bodyBg }}>
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ width: "100%", background: theme.bodyBg }}
          >
            <tr>
              <td align="center" style={{ padding: "40px 16px" }}>
                {/* Main card container with background image and glass overlay */}
                <table
                  role="presentation"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    width: "100%",
                    maxWidth: 680,
                    backgroundImage:
                      "url(https://thestream.ekantah.com/wp-content/uploads/2026/06/ChatGPT-Image-May-23-2026-02_06_53-AM.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: `1px solid ${theme.cardBorder}`,
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.1) inset",
                  }}
                >
                  <tr>
                    <td>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: theme.cardBg,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        {children}
                      </table>
                    </td>
                  </tr>
                </table>

                {/* Subtle footer outside the card */}
                <table
                  role="presentation"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ maxWidth: 680, width: "100%", marginTop: 20 }}
                >
                  <tr>
                    <td align="center">
                      <div
                        style={{
                          color: theme.footerText,
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 11,
                          lineHeight: "16px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Sent with care from The Stream by Ekantah &middot;
                        Tirthan Valley
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  );
}

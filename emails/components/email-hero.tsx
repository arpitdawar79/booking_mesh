import React from "react";
import type { EmailTheme } from "./themes";
import { SparkleDecoration } from "./sparkle-decoration";

interface EmailHeroProps {
  theme: EmailTheme;
  tagline: string;
  headline: React.ReactNode;
  body: React.ReactNode;
}

export function EmailHero({ theme, tagline, headline, body }: EmailHeroProps) {
  return (
    <tr>
      <td style={{ background: theme.heroBg }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
        >
          <tr>
            <td style={{ padding: "44px 36px 0", position: "relative" }}>
              {/* MagicUI-inspired sparkle decorations */}
              <SparkleDecoration theme={theme} position="top-right" />
              
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
              >
                <tr>
                  <td>
                    {/* Tagline with gradient underline accent */}
                    <div
                      style={{
                        color: theme.heroTagline,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: 11,
                        lineHeight: "16px",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        fontWeight: "bold",
                        display: "inline-block",
                        borderBottom: `2px solid ${theme.sparkleColor}`,
                        paddingBottom: 4,
                      }}
                    >
                      {tagline}
                    </div>

                    {/* Headline with elegant serif */}
                    <div
                      style={{
                        color: theme.heroHeadline,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 36,
                        lineHeight: "44px",
                        fontWeight: "normal",
                        paddingTop: 16,
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {headline}
                    </div>

                    {/* Body text */}
                    <div
                      style={{
                        color: theme.heroBody,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: 15,
                        lineHeight: "26px",
                        paddingTop: 18,
                        maxWidth: 520,
                      }}
                    >
                      {body}
                    </div>
                  </td>
                </tr>

                {/* Gradient accent divider bar */}
                <tr>
                  <td style={{ paddingTop: 32 }}>
                    <table
                      role="presentation"
                      width="100%"
                      cellPadding={0}
                      cellSpacing={0}
                      style={{
                        background: theme.heroDividerBg,
                        borderRadius: "0 0 12px 12px",
                        overflow: "hidden",
                      }}
                    >
                      <tr>
                        <td
                          style={{
                            height: 10,
                            lineHeight: "10px",
                            background: `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientMid}, ${theme.gradientTo})`,
                            borderRadius: "0 0 4px 4px",
                          }}
                        >
                          &nbsp;
                        </td>
                      </tr>
                    </table>
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

import React from "react";
import type { EmailTheme } from "./themes";

interface SparkleDecorationProps {
  theme: EmailTheme;
  position?: "top-right" | "bottom-left";
}

export function SparkleDecoration({ theme, position = "top-right" }: SparkleDecorationProps) {
  const align = position === "top-right" ? "right" : "left";
  const valign = position === "top-right" ? "top" : "bottom";
  
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      align={align}
      style={{
        opacity: 0.45,
        paddingBottom: position === "bottom-left" ? 12 : 0,
        paddingTop: position === "top-right" ? 0 : 12,
      }}
    >
      <tr>
        <td style={{ fontSize: 18, lineHeight: "22px", color: theme.sparkleColor }}>
          {position === "top-right" ? "\u2728" : "\u2727"}
        </td>
      </tr>
    </table>
  );
}

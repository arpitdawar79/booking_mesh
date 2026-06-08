import React from "react";
import type { EmailTheme } from "./themes";

interface DataRowProps {
  theme: EmailTheme;
  label: string;
  value: React.ReactNode;
}

export function DataRow({ theme, label, value }: DataRowProps) {
  return (
    <>
      <tr>
        <td style={{ paddingBottom: 4 }}>
          <div
            style={{
              color: theme.rowLabel,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 10,
              lineHeight: "14px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "bold",
            }}
          >
            {label}
          </div>
        </td>
      </tr>
      <tr>
        <td style={{ paddingBottom: 16 }}>
          <div
            style={{
              color: theme.rowValue,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 15,
              lineHeight: "22px",
              fontWeight: "bold",
            }}
          >
            {value}
          </div>
        </td>
      </tr>
    </>
  );
}

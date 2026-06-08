import type { EmailTheme } from "./themes";

interface InfoCardProps {
  theme: EmailTheme;
  icon: string;
  title: string;
  description: string;
}

export function InfoCard({ theme, icon, title, description }: InfoCardProps) {
  return (
    <tr>
      <td style={{ paddingBottom: 18 }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tr>
            <td
              style={{
                width: 40,
                verticalAlign: "top",
                paddingTop: 2,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  background: theme.cardBg,
                  border: `1px solid ${theme.sectionBorder}`,
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  textAlign: "center",
                  lineHeight: "36px",
                  display: "inline-block",
                }}
              >
                {icon}
              </div>
            </td>
            <td style={{ verticalAlign: "top", paddingLeft: 12 }}>
              <div
                style={{
                  color: theme.rowValue,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "22px",
                  fontWeight: "bold",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  color: theme.sectionBody,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 14,
                  lineHeight: "22px",
                  paddingTop: 2,
                }}
              >
                {description}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}

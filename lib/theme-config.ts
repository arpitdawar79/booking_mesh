export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemeConfig {
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  typography: {
    fontSans: string;
    fontDisplay: string;
    fontMono: string;
    trackingTight: string;
    trackingNormal: string;
    trackingWide: string;
  };
  spacing: {
    radius: string;
    containerPadding: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
}

export const themeConfig: ThemeConfig = {
  colors: {
    light: {
      background: "#F7F5F2", // Warm alabaster / Linen
      foreground: "#1c2826", // Deep spruce/pine - elegant dark slate-green
      card: "#ffffff", // Pure white for clean card division
      cardForeground: "#1c2826",
      popover: "#ffffff",
      popoverForeground: "#1c2826",
      primary: "#2c4a3f", // Deep forest sage
      primaryForeground: "#F7F5F2",
      secondary: "#f4f2ee", // Warm sand / Linen fill
      secondaryForeground: "#2c4a3f",
      muted: "#f0ede6", // Lighter warm sand for structural tabs
      mutedForeground: "#6b7773", // Sage grey
      accent: "#e5dcd3", // Warm champagne / Clay accent
      accentForeground: "#2c4a3f",
      destructive: "#b24a37", // Rust terracotta red - organic and serious
      destructiveForeground: "#F7F5F2",
      border: "#e8e4dc", // Soft warm clay outline
      input: "#e8e4dc",
      ring: "#2c4a3f",
    },
    dark: {
      background: "#0b1416", // Deep obsidian spruce/teal - premium dark executive workspace
      foreground: "#f3f6f5", // Airy silver-sage
      card: "#112023", // Lighter spruce-teal card surface with high depth
      cardForeground: "#f3f6f5",
      popover: "#112023",
      popoverForeground: "#f3f6f5",
      primary: "#e2c29d", // Champagne gold / burnished brass
      primaryForeground: "#0b1416",
      secondary: "#182c30", // Muted spruce-teal
      secondaryForeground: "#f3f6f5",
      muted: "#182c30",
      mutedForeground: "#7fa0a4", // Sophisticated slate-teal
      accent: "#243f44", // Deep moss/spruce highlight
      accentForeground: "#e2c29d",
      destructive: "#cd5a4a", // Warm rust terracotta red
      destructiveForeground: "#F7F5F2",
      border: "#1d363b", // Fine spruce border
      input: "#1d363b",
      ring: "#e2c29d",
    },
  },
  typography: {
    fontSans:
      "var(--font-jakarta), var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
    fontDisplay:
      "var(--font-outfit), var(--font-jakarta), ui-sans-serif, system-ui, sans-serif",
    fontMono: "var(--font-space-mono), ui-monospace, monospace",
    trackingTight: "-0.025em",
    trackingNormal: "0em",
    trackingWide: "0.025em",
  },
  spacing: {
    radius: "0.75rem", // slightly softer modern corners
    containerPadding: "1.25rem",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(11, 20, 22, 0.05)",
    md: "0 4px 12px -2px rgba(11, 20, 22, 0.08), 0 2px 6px -1px rgba(11, 20, 22, 0.04)",
    lg: "0 12px 24px -4px rgba(11, 20, 22, 0.12), 0 4px 12px -2px rgba(11, 20, 22, 0.06)",
    glow: "0 0 24px -4px rgba(226, 194, 157, 0.15)", // luxurious warm gold glow for dark mode
  },
};

export function getThemeCssVariablesString() {
  const camelToKebab = (str: string) =>
    str.replace(/([A-Z])/g, "-$1").toLowerCase();

  const lightColors = Object.entries(themeConfig.colors.light)
    .map(([key, val]) => `  --${camelToKebab(key)}: ${val};`)
    .join("\n");

  const darkColors = Object.entries(themeConfig.colors.dark)
    .map(([key, val]) => `  --${camelToKebab(key)}: ${val};`)
    .join("\n");

  return `
:root {
${lightColors}
  --radius: ${themeConfig.spacing.radius};
  --font-sans: ${themeConfig.typography.fontSans};
  --font-display: ${themeConfig.typography.fontDisplay};
  --font-mono: ${themeConfig.typography.fontMono};
  --glow-color: rgba(44, 74, 63, 0.08);
  --glow-shadow: 0 0 24px -4px rgba(44, 74, 63, 0.06);
}
.dark {
${darkColors}
  --glow-color: rgba(226, 194, 157, 0.12);
  --glow-shadow: ${themeConfig.shadows.glow};
}
`;
}

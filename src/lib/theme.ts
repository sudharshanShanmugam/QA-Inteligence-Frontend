import { createTheme, Theme } from "@mui/material/styles";

export function buildTheme(mode: "light" | "dark"): Theme {
  const isDark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary:   { main: "#4f46e5", light: "#818cf8", dark: "#3730a3" },
      secondary: { main: "#0ea5e9", light: "#38bdf8", dark: "#0284c7" },
      error:     { main: "#ef4444" },
      warning:   { main: "#f59e0b" },
      success:   { main: "#10b981" },
      background: {
        default: isDark ? "#0f1117" : "#f8fafc",
        paper:   isDark ? "#1a1f2e" : "#ffffff",
      },
      text: {
        primary:   isDark ? "#f1f5f9" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#64748b",
      },
      divider: isDark ? "#1e293b" : "#e2e8f0",
    },
    typography: {
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      h4: { fontWeight: 800, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700 },
      body2: { lineHeight: 1.6 },
      caption: { lineHeight: 1.5 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: "none" } },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            boxShadow: "none",
            "&:before": { display: "none" },
            border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
            borderRadius: "10px !important",
            "&.Mui-expanded": { margin: 0 },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: { minHeight: 52, "&.Mui-expanded": { minHeight: 52 } },
          content: { margin: "14px 0", "&.Mui-expanded": { margin: "14px 0" } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: { borderColor: isDark ? "#1e293b" : "#e2e8f0" },
          root: {
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "#334155" : "#94a3b8" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#4f46e5" },
          },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
    },
  });
}

// Default export (light theme) — preserved for backward compatibility with MuiProvider etc.
const theme = buildTheme("light");
export default theme;

// Κεντρικά χρώματα για όλο το app
export const palette = {
  primary:   { main: "#4F46E5", contrastText: "#FFFFFF" }, // indigo-600
  secondary: { main: "#14B8A6", contrastText: "#081C15" }, // teal-500
  error:     { main: "#EF4444" },
  warning:   { main: "#F59E0B" },
  info:      { main: "#3B82F6" },
  success:   { main: "#22C55E" },

  // Brand / Social
  google:    "#DB4437",
  facebook:  "#1877F2",

  // Neutrals
  background: { default: "#0B1020", paper: "#0F172A" }, // dark-ish
  text:       { primary: "#E5E7EB", secondary: "#9CA3AF" },
};
export type Palette = typeof palette;

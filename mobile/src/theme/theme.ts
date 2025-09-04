import { DefaultTheme } from "react-native-paper";
import { colors } from "./colors";

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    placeholder: colors.textMuted,
    accent: colors.accent,
  },
  roundness: 12,
};

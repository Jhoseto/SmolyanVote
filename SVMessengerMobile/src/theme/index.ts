/**
 * Theme Export
 * Centralized theme configuration
 */

import { Colors, ColorPalette } from './colors';
import { Typography, TypographySystem } from './typography';
import { Spacing, SpacingSystem } from './spacing';
import { Shadows, ShadowsSystem } from './shadows';

export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  shadows: Shadows,
};

export type { ColorPalette, TypographySystem, SpacingSystem, ShadowsSystem };

// Re-export for convenience
export { Colors, Typography, Spacing, Shadows };


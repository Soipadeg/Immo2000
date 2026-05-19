/**
 * Design System Tokens
 * Centralized design tokens for consistent theming
 */

export const colors = {
  // Primary Colors
  primary: {
    blue: '#2563EB',
    green: '#10B981',
    orange: '#F59E0B',
  },

  // Neutrals
  white: '#FFFFFF',
  light: '#F9FAFB',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Special
  border: '#D1D5DB',
  disabled: '#9CA3AF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    secondary: "'Poppins', sans-serif",
    mono: "'Fira Code', monospace",
  },

  // Font Sizes
  fontSize: {
    h1: '2.5rem', // 40px
    h2: '2rem', // 32px
    h3: '1.5rem', // 24px
    h4: '1.25rem', // 20px
    h5: '1.125rem', // 18px
    h6: '1rem', // 16px
    bodyLarge: '1.125rem', // 18px
    body: '1rem', // 16px
    small: '0.875rem', // 14px
    tiny: '0.75rem', // 12px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-1px',
    tight: '-0.5px',
    normal: '0',
    wide: '0.5px',
  },
};

export const spacing = {
  xs: '4px', // 0.25rem
  sm: '8px', // 0.5rem
  md: '12px', // 0.75rem
  lg: '16px', // 1rem
  xl: '24px', // 1.5rem
  '2xl': '32px', // 2rem
  '3xl': '48px', // 3rem
  '4xl': '64px', // 4rem
};

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  focus: '0 0 0 3px rgba(37, 99, 235, 0.1)',
};

export const transitions = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const breakpoints = {
  mobile: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const container = {
  maxWidth: '1200px',
  paddingMobile: '1rem',
  paddingDesktop: '1.5rem',
};

// Component-specific tokens

export const buttonTokens = {
  primary: {
    background: colors.primary.blue,
    color: colors.white,
    border: 'none',
    shadow: shadows.md,
  },
  secondary: {
    background: 'transparent',
    color: colors.primary.blue,
    border: `2px solid ${colors.primary.blue}`,
    shadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: colors.primary.blue,
    border: 'none',
    shadow: 'none',
  },
  danger: {
    background: colors.error,
    color: colors.white,
    border: 'none',
    shadow: shadows.md,
  },
};

export const buttonSizes = {
  small: {
    padding: '8px 16px',
    fontSize: typography.fontSize.small,
    height: '36px',
  },
  medium: {
    padding: '12px 24px',
    fontSize: typography.fontSize.body,
    height: '44px',
  },
  large: {
    padding: '16px 32px',
    fontSize: typography.fontSize.bodyLarge,
    height: '52px',
  },
};

export const inputTokens = {
  height: '44px',
  heightMobile: '40px',
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.md,
  padding: '12px 16px',
  fontSize: typography.fontSize.body,
  background: colors.white,
};

export const cardTokens = {
  background: colors.white,
  borderRadius: borderRadius.lg,
  shadow: shadows.md,
  padding: spacing.xl,
  border: `1px solid ${colors.gray[100]}`,
};

export const navbarTokens = {
  heightDesktop: '64px',
  heightMobile: '56px',
  background: colors.white,
  shadow: shadows.sm,
  zIndex: 1000,
};

export const footerTokens = {
  background: colors.gray[800],
  color: colors.white,
  padding: spacing['3xl'],
  borderTop: `1px solid ${colors.gray[700]}`,
};

// Export all tokens as default
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  container,
  buttonTokens,
  buttonSizes,
  inputTokens,
  cardTokens,
  navbarTokens,
  footerTokens,
};

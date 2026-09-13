export const palette = {
  sumi: '#1a1a1a',
  indigo: '#1b3a5c',
  beni: '#c1352f',
  ochre: '#c98a3b',
  washi: '#f4ecd8',
  matcha: '#6b7f4e',
  ai: '#22304a',
} as const

export const neutral = {
  0: '#ffffff',
  25: '#fcfbf8',
  50: '#f7f5f0',
  100: '#efece4',
  150: '#e6e2d8',
  200: '#dcd7ca',
  300: '#c4bdac',
  400: '#9a9384',
  500: '#6f695c',
  600: '#514c42',
  700: '#3a362e',
  800: '#26231d',
  900: '#161411',
  1000: '#000000',
} as const

export type ColorRole = {
  canvas: string
  surface: string
  surfaceMuted: string
  raised: string
  border: string
  borderStrong: string
  text: string
  textMuted: string
  textFaint: string
  accent: string
  accentSoft: string
  onAccent: string
  danger: string
  dangerSoft: string
  success: string
  successSoft: string
}

export const light: ColorRole = {
  canvas: neutral[50],
  surface: 'rgba(255, 255, 255, 0.82)',
  surfaceMuted: neutral[100],
  raised: neutral[0],
  border: 'rgba(26, 26, 26, 0.09)',
  borderStrong: 'rgba(26, 26, 26, 0.16)',
  text: neutral[900],
  textMuted: neutral[500],
  textFaint: neutral[400],
  accent: palette.beni,
  accentSoft: 'rgba(193, 53, 47, 0.10)',
  onAccent: neutral[0],
  danger: palette.beni,
  dangerSoft: 'rgba(193, 53, 47, 0.12)',
  success: palette.matcha,
  successSoft: 'rgba(107, 127, 78, 0.14)',
}

export const dark: ColorRole = {
  canvas: '#12110f',
  surface: 'rgba(30, 28, 25, 0.78)',
  surfaceMuted: '#222019',
  raised: '#2a2721',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  text: neutral[50],
  textMuted: neutral[300],
  textFaint: neutral[400],
  accent: '#e0655f',
  accentSoft: 'rgba(224, 101, 95, 0.16)',
  onAccent: '#1a1a1a',
  danger: '#e0655f',
  dangerSoft: 'rgba(224, 101, 95, 0.18)',
  success: '#9bb178',
  successSoft: 'rgba(155, 177, 120, 0.18)',
}

export const semantic = light

export const typography = {
  family: {
    ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
    display: "'Shippori Mincho', 'Zen Old Mincho', serif",
    mono: "'SF Mono', ui-monospace, 'JetBrains Mono', monospace",
  },
  size: {
    xs: '0.75rem',
    sm: '0.8125rem',
    base: '0.9375rem',
    md: '1.0625rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '2.75rem',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  leading: {
    tight: 1.15,
    normal: 1.5,
    relaxed: 1.7,
  },
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
} as const

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '18px',
  xl: '24px',
  pill: '999px',
} as const

export const shadow = {
  xs: '0 1px 2px rgba(26, 26, 26, 0.06)',
  sm: '0 1px 3px rgba(26, 26, 26, 0.08), 0 1px 2px rgba(26, 26, 26, 0.04)',
  md: '0 8px 24px -8px rgba(26, 26, 26, 0.18), 0 2px 6px rgba(26, 26, 26, 0.06)',
  lg: '0 24px 48px -20px rgba(26, 26, 26, 0.28), 0 8px 16px -8px rgba(26, 26, 26, 0.12)',
  focus: '0 0 0 2px rgba(244, 236, 216, 1), 0 0 0 4px rgba(193, 53, 47, 0.75)',
} as const

export const blur = {
  bar: '12px',
  panel: '20px',
} as const

export const motion = {
  fast: '150ms',
  base: '220ms',
  slow: '320ms',
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
} as const

export const control = {
  sm: '32px',
  md: '40px',
  lg: '48px',
} as const

export const zIndex = {
  map: 0,
  overlay: 10,
  panel: 20,
  bar: 25,
  modal: 30,
  toast: 40,
} as const

export const mapTokens = {
  labelHalo: palette.washi,
  labelText: palette.sumi,
  roadCasing: palette.sumi,
  route: palette.beni,
  marker: palette.beni,
  textureOpacity: 0.18,
  japanLand: '#ecdcb8',
  japanCoast: '#6b5a3a',
  foreignFill: '#ded8ca',
  foreignOpacity: 1,
} as const

export const tokens = {
  palette,
  neutral,
  light,
  dark,
  semantic,
  typography,
  spacing,
  radius,
  shadow,
  blur,
  motion,
  control,
  zIndex,
  map: mapTokens,
} as const

export type Tokens = typeof tokens
export type { ColorRole as ColorRoleType }

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import {
  light,
  dark,
  typography,
  radius,
  shadow,
  spacing,
  motion,
  control,
  blur,
  zIndex,
  type ColorRole,
} from '@/design/tokens'

function colorVars(role: ColorRole): string {
  return [
    ['--canvas', role.canvas],
    ['--surface', role.surface],
    ['--surface-muted', role.surfaceMuted],
    ['--raised', role.raised],
    ['--border', role.border],
    ['--border-strong', role.borderStrong],
    ['--text', role.text],
    ['--text-muted', role.textMuted],
    ['--text-faint', role.textFaint],
    ['--accent', role.accent],
    ['--accent-soft', role.accentSoft],
    ['--on-accent', role.onAccent],
    ['--danger', role.danger],
    ['--danger-soft', role.dangerSoft],
    ['--success', role.success],
    ['--success-soft', role.successSoft],
  ]
    .map(([name, value]) => `${name}: ${value};`)
    .join('\n    ')
}

function scaleVars(prefix: string, scale: Record<string, string>) {
  return Object.entries(scale)
    .map(([key, value]) => `--${prefix}-${key}: ${value};`)
    .join('\n    ')
}

const STYLE_ID = 'inkyo-theme'

function buildCss(): string {
  return `
:root {
    ${colorVars(light)}
    --font-ui: ${typography.family.ui};
    --font-display: ${typography.family.display};
    --font-mono: ${typography.family.mono};
    ${scaleVars('space', spacing as unknown as Record<string, string>)}
    ${scaleVars('radius', radius as unknown as Record<string, string>)}
    ${scaleVars('shadow', shadow as unknown as Record<string, string>)}
    ${scaleVars('blur', blur as unknown as Record<string, string>)}
    ${scaleVars('motion', motion as unknown as Record<string, string>)}
    ${scaleVars('control', control as unknown as Record<string, string>)}
    --z-map: ${zIndex.map};
    --z-overlay: ${zIndex.overlay};
    --z-panel: ${zIndex.panel};
    --z-bar: ${zIndex.bar};
    --z-modal: ${zIndex.modal};
    --z-toast: ${zIndex.toast};
}

@media (prefers-color-scheme: dark) {
  :root {
    ${colorVars(dark)}
  }
}
`
}

export function applyTheme() {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = buildCss()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme()
  }, [])
  return children
}

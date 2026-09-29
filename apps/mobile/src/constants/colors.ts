/**
 * Design tokens shared conceptually with the web app's Tailwind palette
 * so both platforms stay visually consistent.
 */
export const Colors = {
  primary: '#0B0F1A', // Near-black for headers/nav
  accent: '#F59E0B', // Amber — matches web CTA color
  background: '#FFFFFF', // White background
  surface: '#FAFAFA', // Subtle raised surface
  text: '#18181B', // zinc-900 equivalent
  textSecondary: '#71717A', // zinc-500 equivalent
  border: '#E4E4E7', // zinc-200 equivalent
  success: '#10B981', // emerald-500
  error: '#EF4444', // red-500
} as const

export type ColorName = keyof typeof Colors

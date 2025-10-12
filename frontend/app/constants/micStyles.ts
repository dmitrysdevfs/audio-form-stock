export const micSizes = {
  sm: { button: 'w-20 h-20', animation: 50 },
  md: { button: 'w-24 h-24', animation: 70 },
  lg: { button: 'w-32 h-32', animation: 90 },
  xl: { button: 'w-40 h-40', animation: 110 },
} as const;

export const micColors = {
  active: 'bg-danger text-white shadow-danger-500/50',
  idle: 'bg-purple-500 text-white shadow-purple-500/50',
  success: 'bg-success text-white shadow-success-500/50',
  warning: 'bg-warning text-white shadow-warning-500/50',
} as const;

export const micAnimationSettings = {
  idle: { speed: 1, direction: 1 },
  listening: { speed: 1.5, direction: 1 },
  processing: { speed: 0.8, direction: 1 },
  error: { speed: 0.5, direction: -1 },
} as const;

export type MicSize = keyof typeof micSizes;
export type MicColor = keyof typeof micColors;
export type MicAnimationState = keyof typeof micAnimationSettings;

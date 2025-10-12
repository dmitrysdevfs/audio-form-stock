export const micSizes = {
  sm: { button: 'w-16 h-16', animation: 110 },
  md: { button: 'w-20 h-20', animation: 130 },
  lg: { button: 'w-28 h-28', animation: 170 },
  xl: { button: 'w-36 h-36', animation: 210 },
} as const;

export const micColors = {
  active: 'bg-transparent text-danger shadow-danger-500/50',
  idle: 'bg-transparent text-purple-500 shadow-purple-500/50',
  success: 'bg-transparent text-success shadow-success-500/50',
  warning: 'bg-transparent text-warning shadow-warning-500/50',
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

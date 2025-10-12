'use client';

import { MicAnimationDotLottie as MicAnimationComponent } from '../features/audio/ui/MicAnimationDotLottie';

interface MicAnimationProps {
  isListening?: boolean;
  size?: number;
  className?: string;
}

/**
 * MicAnimation: Enhanced Lottie animation for microphone
 *
 * Features:
 * - Enhanced animation control with speed and direction
 * - Multiple animation states (idle, listening, processing, error)
 * - Smooth transitions and better performance
 * - TypeScript support with proper typing
 *
 * Usage:
 * <MicAnimation
 *   isListening={isListening}
 *   size={100}
 * />
 */
export default function MicAnimation({
  isListening = false,
  size = 100,
  className = '',
}: MicAnimationProps) {
  return <MicAnimationComponent isListening={isListening} size={size} className={className} />;
}

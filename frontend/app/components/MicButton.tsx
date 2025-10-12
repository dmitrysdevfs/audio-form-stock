'use client';

import { MicButton as MicButtonComponent } from '../features/audio/ui/MicButton';
import { type MicSize } from '../constants/micStyles';

interface MicButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: MicSize;
  className?: string;
}

/**
 * MicButton: Combined microphone button with Lottie animation
 *
 * Features:
 * - Lottie animation that responds to recording state
 * - Color changes based on recording state (blue -> red)
 * - Smooth transitions with speed and direction control
 * - Customizable size and colors
 * - Enhanced animation states (idle, listening, processing, error)
 *
 * Usage:
 * <MicButton
 *   isRecording={isRecording}
 *   onToggle={handleToggle}
 *   size="lg"
 * />
 */
export default function MicButton({
  isRecording,
  onToggle,
  disabled = false,
  size = 'lg',
  className = '',
}: MicButtonProps) {
  return (
    <MicButtonComponent
      isRecording={isRecording}
      isListening={isRecording}
      onPress={onToggle}
      size={size}
      disabled={disabled}
      className={className}
    />
  );
}

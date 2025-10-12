'use client';

import { Button } from '@nextui-org/react';
import { MicAnimationDotLottie } from './MicAnimationDotLottie';
import { micSizes, micColors, type MicSize, type MicColor } from '../../../constants/micStyles';

interface MicButtonProps {
  isRecording: boolean;
  isListening?: boolean;
  onPress: () => void;
  size?: MicSize;
  color?: MicColor;
  disabled?: boolean;
  className?: string;
  animationSize?: number;
}

export const MicButton = ({
  isRecording,
  isListening = false,
  onPress,
  size = 'md',
  color = 'idle',
  disabled = false,
  className = '',
  animationSize,
}: MicButtonProps) => {
  const { button } = micSizes[size];
  const colorClass = isRecording ? micColors.active : micColors[color];
  const animationSizeValue = animationSize || micSizes[size].animation;

  return (
    <Button
      isIconOnly
      className={`${button} ${colorClass} ${className}`}
      onPress={onPress}
      disabled={disabled}
      radius="full"
      size="lg"
    >
      <MicAnimationDotLottie
        isListening={isListening}
        size={animationSizeValue}
        isActive={isRecording}
      />
    </Button>
  );
};

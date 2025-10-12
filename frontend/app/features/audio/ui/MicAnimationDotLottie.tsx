'use client';

import { useEffect, useRef, useState } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-web';
import { micAnimationSettings, type MicAnimationState } from '../../../constants/micStyles';

interface MicAnimationDotLottieProps {
  isListening: boolean;
  size?: number;
  animationState?: MicAnimationState;
  className?: string;
}

export const MicAnimationDotLottie = ({
  isListening,
  size = 70,
  animationState = 'idle',
  className = '',
}: MicAnimationDotLottieProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotLottieRef = useRef<DotLottie | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const settings = micAnimationSettings[animationState];

  // Initialize DotLottie
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      dotLottieRef.current = new DotLottie({
        canvas: canvasRef.current,
        src: '/animations/voice.lottie',
        loop: isListening,
        autoplay: false,
      });

      // Set canvas size
      canvasRef.current.width = size;
      canvasRef.current.height = size;

      // Handle load events
      dotLottieRef.current.addEventListener('ready', () => {
        setIsLoaded(true);
      });
    } catch (error) {
      console.error('Failed to initialize DotLottie:', error);
    }

    // Cleanup on unmount
    return () => {
      if (dotLottieRef.current) {
        dotLottieRef.current.destroy();
        dotLottieRef.current = null;
      }
    };
  }, [size]);

  // Control animation based on listening state and settings
  useEffect(() => {
    if (!dotLottieRef.current || !isLoaded) return;

    const dotLottie = dotLottieRef.current;

    // Apply animation settings
    dotLottie.setSpeed(settings.speed);

    // Control playback based on listening state
    if (isListening) {
      dotLottie.play();
    } else {
      dotLottie.pause();
    }
  }, [isListening, isLoaded, settings.speed]);

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    </div>
  );
};

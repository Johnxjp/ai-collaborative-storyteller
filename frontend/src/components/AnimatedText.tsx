'use client';

import { useState, useEffect } from 'react';

interface AnimatedTextProps {
  fullText: string;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  wordDelay?: number;
  initialDelay?: number;
  fadeDuration?: number;
}

export default function AnimatedText({ 
  fullText, 
  isAnimating, 
  onAnimationComplete, 
  wordDelay = 300,
  initialDelay = 0,
  fadeDuration = 500
}: AnimatedTextProps) {
  const [visibleWords, setVisibleWords] = useState<number>(isAnimating ? 0 : fullText.split(' ').length);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isAnimating) {
      setVisibleWords(fullText.split(' ').length);
      setHasStarted(false);
      return;
    }

    // Reset state when starting
    setVisibleWords(0);
    setHasStarted(false);

    // Initial delay before starting
    const startTimer = setTimeout(() => {
      setHasStarted(true);
    }, initialDelay);

    return () => clearTimeout(startTimer);
  }, [fullText, isAnimating, initialDelay]);

  useEffect(() => {
    if (!isAnimating || !hasStarted) return;

    const words = fullText.split(' ');
    
    if (visibleWords >= words.length) {
      onAnimationComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setVisibleWords(prev => prev + 1);
    }, wordDelay);

    return () => clearTimeout(timer);
  }, [fullText, isAnimating, hasStarted, visibleWords, wordDelay, onAnimationComplete]);

  const words = fullText.split(' ');

  return (
    <span className="text-gray-800">
      {words.map((word, index) => (
        <span
          key={index}
          className={`inline-block transition-opacity duration-${fadeDuration} ${
            index < visibleWords ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transitionDuration: `${fadeDuration}ms`
          }}
        >
          {word}
          {index < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </span>
  );
}
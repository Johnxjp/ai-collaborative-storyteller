'use client';

import { useState, useEffect } from 'react';

export const useTextAnimation = (text: string, shouldAnimate: boolean, delay: number = 200) => {
  const [animatedText, setAnimatedText] = useState('');

  useEffect(() => {
    if (!shouldAnimate || !text) {
      setAnimatedText(text);
      return;
    }

    const words = text.split(' ');
    setAnimatedText('');

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setAnimatedText(prevText => {
          const newText = prevText ? `${prevText} ${words[currentIndex]}` : words[currentIndex];
          return newText;
        });
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [text, shouldAnimate, delay]);

  return { animatedText };
};

'use client';

import { useCallback } from 'react';

export const useTextAnimation = () => {
  const animateText = useCallback((word: string, wordIndex: number, container: HTMLElement) => {
    const space = document.createTextNode(' ');
    const newTextElement = document.createElement('span');
    newTextElement.id = `word-${wordIndex}`;
    newTextElement.className = 'new-text';
    newTextElement.textContent = word;
    
    container.appendChild(space);
    container.appendChild(newTextElement);
    
    const delay = 200;
    setTimeout(() => {
      newTextElement.classList.add('fade-in');
    }, delay * (wordIndex + 1));
  }, []);

  return { animateText };
};

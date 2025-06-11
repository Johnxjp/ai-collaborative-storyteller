'use client';

import { useCallback } from 'react';

export const useTextAnimation = () => {
  const animateText = useCallback((word: string, globalWordIndex: number, batchIndex: number, container: HTMLElement, isUserText: boolean = false) => {
    // Ensure we're only adding text to paragraph elements
    if (container.tagName !== 'P') {
      console.error('Warning: Trying to add text to non-paragraph element:', container.tagName);
      return;
    }

    const space = document.createTextNode(' ');
    const newTextElement = document.createElement('span');
    newTextElement.id = `word-${globalWordIndex}`;
    newTextElement.className = isUserText ? 'new-text font-semibold' : 'new-text';
    newTextElement.textContent = word;

    container.appendChild(space);
    container.appendChild(newTextElement);

    const delay = 150;
    setTimeout(() => {
      newTextElement.classList.add('fade-in');
    }, delay * (batchIndex + 1));
  }, []);

  return { animateText };
};

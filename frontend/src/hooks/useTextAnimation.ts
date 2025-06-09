'use client';

import { useCallback } from 'react';

export const useTextAnimation = () => {
  const animateText = useCallback((word: string, globalWordIndex: number, batchIndex: number, container: HTMLElement, isUserText: boolean = false) => {
    const space = document.createTextNode(' ');
    const newTextElement = document.createElement('span');
    newTextElement.id = `word-${globalWordIndex}`;
    newTextElement.className = isUserText ? 'new-text user-text' : 'new-text';
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

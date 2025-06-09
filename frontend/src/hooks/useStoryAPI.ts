'use client';

import { useCallback, useRef } from 'react';

export const useStoryAPI = () => {
  const lastRequestRef = useRef<{ story: string } | null>(null);

  const submitStory = useCallback(async (entireStory: string) => {
    // Store for potential retry
    lastRequestRef.current = { story: entireStory };

    const response = await fetch('http://localhost:8000/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        story: entireStory
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate story');
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let aiResponse = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                aiResponse += data.content;
              }
              if (data.done) {
                const nextStoryPart = aiResponse.trim();
                return { nextStoryPart: nextStoryPart };
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Fallback if no done signal received
    const nextStoryPart = aiResponse.trim();
    return { nextStoryPart: nextStoryPart };
  }, []);

  const retryLastRequest = useCallback(async () => {
    if (!lastRequestRef.current) {
      throw new Error('No previous request to retry');
    }

    return await submitStory(lastRequestRef.current.story);
  }, [submitStory]);

  return { submitStory, retryLastRequest };
};

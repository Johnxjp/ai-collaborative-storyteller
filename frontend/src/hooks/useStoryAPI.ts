'use client';

import { useCallback, useRef } from 'react';

export const useStoryAPI = () => {
  const lastRequestRef = useRef<{story: string, input: string} | null>(null);

  const submitStory = useCallback(async (entireStory: string, userInput: string) => {
    // Store for potential retry
    lastRequestRef.current = { story: entireStory, input: userInput };
    
    const response = await fetch('http://localhost:8000/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entire_story: entireStory,
        user_input: userInput
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
                const fullStory = entireStory + ' ' + userInput + ' ' + aiResponse.trim();
                return { fullStory: fullStory.trim() };
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
    const fullStory = entireStory + ' ' + userInput + ' ' + aiResponse.trim();
    return { fullStory: fullStory.trim() };
  }, []);

  const retryLastRequest = useCallback(async () => {
    if (!lastRequestRef.current) {
      throw new Error('No previous request to retry');
    }
    
    return await submitStory(lastRequestRef.current.story, lastRequestRef.current.input);
  }, [submitStory]);

  return { submitStory, retryLastRequest };
};

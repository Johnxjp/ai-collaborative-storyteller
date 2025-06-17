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

  const generateOpening = useCallback(async (category: string, title: string) => {
    const response = await fetch('http://localhost:8000/generate-opening', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        title
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate opening');
    }

    const data = await response.json();
    return {
      openingText: data.opening_text,
      imagePrompt: data.image_prompt,
      title: data.title
    };
  }, []);

  const generateImage = useCallback(async (prompt: string, storyId: string, pageId: string) => {
    try {
      const response = await fetch('http://localhost:8000/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          story_id: storyId,
          page_id: pageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate image');
      }

      const data = await response.json();

      if (!data.image_b64) {
        throw new Error('No image data received from server');
      }

      // Convert base64 to data URL
      const imageUrl = `data:image/png;base64,${data.image_b64}`;

      return {
        imageUrl: imageUrl
      };
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  }, []);

  const fetchOpeningPrompt = useCallback(async (category: string) => {
    console.log('Fetching opening prompt for category:', category);
    const response = await fetch(`http://localhost:8000/opening-prompt?category=${encodeURIComponent(category)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch opening prompt');
    }

    const data = await response.json();
    console.log('Opening prompt data:', data);
    return data.prompt;
  }, []);

  return { submitStory, retryLastRequest, generateOpening, generateImage, fetchOpeningPrompt };
};

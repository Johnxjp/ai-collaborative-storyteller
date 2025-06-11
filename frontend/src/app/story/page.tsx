'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import StoryDisplay from '@/components/StoryDisplay'
import StoryInput from '@/components/StoryInput';
import ErrorMessage from '@/components/ErrorMessage';
import StoryOpening from '@/components/story/StoryOpening';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useStoryAPI } from '@/hooks/useStoryAPI';
import { StoryPageState } from '@/types/story';
import { storyStarters } from '@/data/storyStarters';

export default function StoryPage() {
  const searchParams = useSearchParams();
  const starterId = searchParams.get('starter');

  const [state, setState] = useState<StoryPageState>({
    starterId: starterId || undefined,
    starterTitle: undefined,
    openingText: undefined,
    openingImage: undefined,
    isGeneratingOpening: false,
    story: '',
    userInput: '',
    isLoading: false,
    errorMessage: null,
    turnCount: 0
  });

  const { submitStory, retryLastRequest, generateOpening } = useStoryAPI();

  // Generate opening when component mounts with a starter
  useEffect(() => {
    if (starterId && !state.openingText) {
      const starter = storyStarters.find(s => s.id === starterId);
      if (starter) {
        setState(prev => ({
          ...prev,
          starterTitle: starter.title,
          isGeneratingOpening: true
        }));

        generateOpening(starter.category, starter.title)
          .then(result => {
            setState(prev => ({
              ...prev,
              openingText: result.openingText,
              openingImage: `/scene_opening_${starter.category}.svg`,
              isGeneratingOpening: false
            }));
          })
          .catch(error => {
            console.error('Failed to generate opening:', error);
            setState(prev => ({
              ...prev,
              errorMessage: 'Failed to generate story opening',
              isGeneratingOpening: false
            }));
          });
      }
    }
  }, [starterId, state.openingText, generateOpening]);

  const handleSubmit = async (input: string) => {
    if (input.trim() === '') return;

    const fullStory = (state.openingText || '') + (state.story ? ' ' + state.story : '');
    const storyWithUserInput = fullStory + (fullStory ? ' ' : '') + input;
    const turnCount = state.turnCount + 1;

    setState(prev => ({
      ...prev,
      story: prev.story + (prev.story ? ' ' : '') + input,
      turnCount: turnCount,
      userInput: '',
      isLoading: true,
      errorMessage: null
    }));

    // Wait for user text to finish animating before making API call
    const userWords = input.trim().split(' ');
    const animationDelay = userWords.length * 200; // 200ms per word

    setTimeout(async () => {
      try {
        const result = await submitStory(storyWithUserInput);
        setState(prev => ({
          ...prev,
          story: prev.story + ' ' + result.nextStoryPart,
          turnCount: turnCount + 1,
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to submit story:', error);
        setState(prev => ({
          ...prev,
          errorMessage: 'Something went wrong',
          isLoading: false
        }));
      }
    }, animationDelay);
  };

  const handleRetry = async () => {
    setState(prev => ({ ...prev, errorMessage: null, isLoading: true }));

    try {
      const result = await retryLastRequest();
      setState(prev => ({
        ...prev,
        story: prev.story + (prev.story ? ' ' : '') + result.nextStoryPart,
        turnCount: prev.turnCount + 1,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to retry story:', error);
      setState(prev => ({
        ...prev,
        errorMessage: 'Something went wrong',
        isLoading: false
      }));
    }
  };

  const handleInputChange = (value: string) => {
    setState(prev => ({ ...prev, userInput: value, errorMessage: null }));
  };

  // Show loading while generating opening
  if (state.isGeneratingOpening) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingIndicator />
          <p className="mt-4 text-gray-600">Generating your story opening...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="max-w-2xl w-full px-4 relative">
          {state.openingText && (
            <StoryOpening
              title={state.starterTitle || 'Your Story'}
              openingText={state.openingText}
              imageUrl={state.openingImage}
              isAnimating={false}
            />
          )}

          <StoryDisplay
            story={state.story}
            turnCount={state.turnCount}
          />

          {state.errorMessage && (
            <ErrorMessage
              message={state.errorMessage}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>

      <StoryInput
        value={state.userInput}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={state.isLoading}
      />
    </div>
  );
}

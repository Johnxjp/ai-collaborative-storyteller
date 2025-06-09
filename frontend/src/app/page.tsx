'use client';

import { useState } from 'react';
import StoryDisplay from '@/components/StoryDisplay'
import StoryInput from '@/components/StoryInput';
import LoadingIndicator from '@/components/LoadingIndicator';
import ErrorMessage from '@/components/ErrorMessage';
import { useStoryAPI } from '@/hooks/useStoryAPI';

interface AppState {
  story: string;
  userInput: string;
  isLoading: boolean;
  error: string | null;
  turnCount: number;
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    story: '',
    userInput: '',
    isLoading: false,
    error: null,
    turnCount: 0
  });

  const { submitStory, retryLastRequest } = useStoryAPI();

  const handleSubmit = async (input: string) => {
    if (input.trim() === '') return;

    setState(prev => ({
      ...prev,
      userInput: '',
      isLoading: true,
      error: null
    }));

    try {
      const result = await submitStory(state.story, input);
      setState(prev => ({
        ...prev,
        story: result.fullStory,
        turnCount: prev.turnCount + 1,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to submit story:', error);
      setState(prev => ({
        ...prev,
        error: 'Something went wrong',
        isLoading: false
      }));
    }
  };

  const handleRetry = async () => {
    setState(prev => ({ ...prev, error: null, isLoading: true }));

    try {
      const result = await retryLastRequest();
      setState(prev => ({
        ...prev,
        story: result.fullStory,
        turnCount: prev.turnCount + 1,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to retry story:', error);
      setState(prev => ({
        ...prev,
        error: 'Something went wrong',
        isLoading: false
      }));
    }
  };

  const handleInputChange = (value: string) => {
    setState(prev => ({ ...prev, userInput: value, error: null }));
  };

  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-center text-3xl font-bold py-6">My Story</h1>

      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="max-w-2xl w-full px-4 relative">
          <StoryDisplay
            story={state.story}
            turnCount={state.turnCount}
          />

          {state.error && (
            <ErrorMessage
              message={state.error}
              onRetry={handleRetry}
            />
          )}

          {state.isLoading && <LoadingIndicator />}
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

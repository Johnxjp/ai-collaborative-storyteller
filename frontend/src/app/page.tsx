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
  errorMessage: string | null;
  turnCount: number;
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    story: '',
    userInput: '',
    isLoading: false,
    errorMessage: null,
    turnCount: 0
  });

  const { submitStory, retryLastRequest } = useStoryAPI();

  const handleSubmit = async (input: string) => {
    if (input.trim() === '') return;

    const storyWithUserInput = state.story + (state.story ? ' ' : '') + input;
    const turnCount = state.turnCount + 1;


    setState(prev => ({
      ...prev,
      story: storyWithUserInput,
      turnCount: turnCount,
      userInput: '',
      isLoading: true,
      errorMessage: null
    }));

    try {
      const result = await submitStory(storyWithUserInput);
      setState(prev => ({
        ...prev,
        story: storyWithUserInput + result.nextStoryPart,
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

  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-center text-3xl font-bold py-6 mt-10">My Story</h1>

      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="max-w-2xl w-full px-4 relative">
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

          {/* {state.isLoading && <LoadingIndicator />} */}
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

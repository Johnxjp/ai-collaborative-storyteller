'use client';

import { useState } from 'react';
import StoryDisplay from '@/components/StoryDisplay'
import StoryInput from '@/components/StoryInput';
import ErrorMessage from '@/components/ErrorMessage';
import { useStoryAPI } from '@/hooks/useStoryAPI';

interface AppState {
  story: string;
  userInput: string;
  isLoading: boolean;
  errorMessage: string | null;
  turnCount: number;
  images: string[]; // Array of image URLs
  isLoadingImage: boolean;
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    story: '',
    userInput: '',
    isLoading: false,
    errorMessage: null,
    turnCount: 0,
    images: [],
    isLoadingImage: false
  });

  const { submitStory, retryLastRequest } = useStoryAPI();

  const loadSceneImage = async (sceneNumber: number) => {
    setState(prev => ({ ...prev, isLoadingImage: true }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const imageUrl = `/scene_${sceneNumber}.png`;
      console.log(`Loading image for scene ${sceneNumber}: ${imageUrl}`);
      setState(prev => ({
        ...prev,
        images: [...prev.images, imageUrl],
        isLoadingImage: false
      }));
    } catch (error) {
      console.error('Failed to load image:', error);
      setState(prev => ({ ...prev, isLoadingImage: false }));
    }
  };

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
        story: storyWithUserInput + ' ' + result.nextStoryPart,
        turnCount: turnCount + 1,
        isLoading: false
      }));

      // Load image after AI response (only on even turn counts, when AI has responded)
      await loadSceneImage(turnCount + 1);
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
            images={state.images}
            isLoadingImage={state.isLoadingImage}
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

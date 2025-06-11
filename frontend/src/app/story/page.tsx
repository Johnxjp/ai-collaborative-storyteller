'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import TurnIndicator from '@/components/TurnIndicator';
import PageContent from '@/components/PageView/PageContent';
import NavigationArrows from '@/components/PageView/NavigationArrows';
import StoryInput from '@/components/StoryInput';
import InputPrompt from '@/components/StoryInput/InputPrompt';
import ErrorMessage from '@/components/ErrorMessage';
import StoryOpening from '@/components/story/StoryOpening';
import LoadingIndicator from '@/components/LoadingIndicator';
import ImageSkeleton from '@/components/ContentGeneration/ImageSkeleton';
import { useStoryAPI } from '@/hooks/useStoryAPI';
import { usePageNavigation } from '@/hooks/usePageNavigation';
import { StoryPageState, Page } from '@/types/story';
import { storyStarters } from '@/data/storyStarters';

export default function StoryPage() {
  const searchParams = useSearchParams();
  const starterId = searchParams.get('starter');
  const pageContentRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<StoryPageState>({
    starterId: starterId || undefined,
    starterTitle: undefined,
    openingText: undefined,
    openingImage: undefined,
    isGeneratingOpening: false,
    pages: [],
    currentPageIndex: 0,
    currentInput: '',
    isGeneratingText: false,
    isGeneratingImage: false,
    errorMessage: null,
    isUserTurn: true
  });

  const { submitStory, generateOpening, generateImage } = useStoryAPI();
  const {
    currentPageIndex,
    currentPage,
    canGoBack,
    canGoForward,
    isOnLatestPage,
    navigatePage,
    pages: managedPages
  } = usePageNavigation({ pages: state.pages });

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
              openingImage: starter.imagePath,
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

  // Update current page index when pages change
  useEffect(() => {
    setState(prev => ({ ...prev, currentPageIndex }));
  }, [currentPageIndex]);

  // Reset scroll position when navigating between pages
  useEffect(() => {
    if (pageContentRef.current) {
      pageContentRef.current.scrollTo(0, 0);
    }
  }, [currentPageIndex]);

  const handleSubmit = async (input: string) => {
    if (input.trim() === '') return;

    const newPageId = uuidv4();
    const turnNumber = state.pages.length + 1;

    // Create new page with user input
    const newPage: Page = {
      id: newPageId,
      userText: input.trim(),
      aiText: '',
      imageUrl: null,
      isComplete: false,
      turnNumber
    };

    setState(prev => ({
      ...prev,
      pages: [...prev.pages, newPage],
      currentInput: '',
      isGeneratingText: true,
      isUserTurn: false
    }));

    try {
      // Generate AI response
      const fullStory = (state.openingText || '') + ' ' +
        state.pages.map(p => p.userText + ' ' + p.aiText).join(' ') + ' ' + input;

      const result = await submitStory(fullStory);

      setState(prev => ({
        ...prev,
        pages: prev.pages.map(page =>
          page.id === newPageId
            ? { ...page, aiText: result.nextStoryPart }
            : page
        ),
        isGeneratingText: false,
        isGeneratingImage: true
      }));

      // Generate image for the page
      const pageContent = input + ' ' + result.nextStoryPart;
      const imageResult = await generateImage(pageContent, turnNumber);

      setState(prev => ({
        ...prev,
        pages: prev.pages.map(page =>
          page.id === newPageId
            ? { ...page, imageUrl: imageResult.imageUrl, isComplete: true }
            : page
        ),
        isGeneratingImage: false,
        isUserTurn: true
      }));

    } catch (error) {
      console.error('Failed to generate story:', error);
      setState(prev => ({
        ...prev,
        errorMessage: 'Something went wrong',
        isGeneratingText: false,
        isGeneratingImage: false,
        isUserTurn: true
      }));
    }
  };

  const handleInputChange = (value: string) => {
    setState(prev => ({ ...prev, currentInput: value, errorMessage: null }));
  };

  const handleRetry = async () => {
    setState(prev => ({ ...prev, errorMessage: null }));

    if (currentPage && !currentPage.isComplete) {
      // Retry the current page generation
      await handleSubmit(currentPage.userText);
    }
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    navigatePage(direction);
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

  const isInputDisabled = state.isGeneratingText || state.isGeneratingImage || !state.isUserTurn;
  const showInputPrompt = state.isUserTurn && !state.isGeneratingText && !state.isGeneratingImage;

  return (
    <div className="h-screen flex flex-col relative">
      {/* Turn Indicator */}
      <TurnIndicator
        isUserTurn={state.isUserTurn}
        isGenerating={state.isGeneratingText || state.isGeneratingImage}
      />

      {/* Navigation Arrows */}
      <NavigationArrows
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNavigate={handleNavigation}
      />

      {/* Main Content Area */}
      <div className="flex-1 pt-16 pb-4 max-w-2xl mx-auto px-4">
        <div className="page-content-container" ref={pageContentRef}>
          {/* Story Opening */}
          {state.openingText && managedPages.length === 0 && (
            <StoryOpening
              title={state.starterTitle || 'Your Story'}
              openingText={state.openingText}
              imageUrl={state.openingImage}
              isAnimating={false}
            />
          )}

          {/* Current Page Content */}
          {currentPage && (
            <div>
              {/* Image with loading state */}
              {state.isGeneratingImage && isOnLatestPage ? (
                <ImageSkeleton />
              ) : currentPage.imageUrl ? (
                <PageContent
                  page={currentPage}
                  isAnimating={isOnLatestPage && (state.isGeneratingText || state.isGeneratingImage)}
                />
              ) : (
                <div className="w-full max-w-2xl mx-auto px-4">
                  <div className="space-y-4">
                    {currentPage.userText && (
                      <div className="text-lg leading-relaxed">
                        <p className="font-bold text-gray-800">
                          {currentPage.userText}
                        </p>
                      </div>
                    )}
                    {currentPage.aiText && (
                      <div className="text-lg leading-relaxed">
                        <p className="text-gray-700">
                          {currentPage.aiText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {state.errorMessage && (
            <ErrorMessage
              message={state.errorMessage}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>

      {/* Input Prompt */}
      <InputPrompt isVisible={showInputPrompt} />

      {/* Input Field */}
      <StoryInput
        value={state.currentInput}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isInputDisabled}
      />

      <style jsx>{`
        .page-content-container {
          height: calc(100vh - 200px);
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        .page-content-container::-webkit-scrollbar {
          width: 6px;
        }

        .page-content-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .page-content-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .page-content-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

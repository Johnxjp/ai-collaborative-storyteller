'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import TurnIndicator from '@/components/TurnIndicator';
import PageContent from '@/components/PageView/PageContent';
import NavigationArrows from '@/components/PageView/NavigationArrows';
import StoryInput from '@/components/StoryInput';
import ErrorMessage from '@/components/ErrorMessage';
import StoryOpening from '@/components/StoryOpening';
import LoadingIndicator from '@/components/LoadingIndicator';
import ImageSkeleton from '@/components/ContentGeneration/ImageSkeleton';
import { useStoryAPI } from '@/hooks/useStoryAPI';
import { usePageNavigation } from '@/hooks/usePageNavigation';
import { StoryPageState, Page } from '@/types/story';
import { storyStarters } from '@/data/storyStarters';
import { useConversation } from '@elevenlabs/react';

export default function StoryPage() {
  const searchParams = useSearchParams();
  const starterId = searchParams.get('starter');
  const pageContentRef = useRef<HTMLDivElement>(null);

  // Chance this doesn't exist
  const starter = storyStarters.find(s => s.id === starterId);
  const category = starter ? starter.category : 'adventure';
  // Track if opening has been shown to animate only on first view
  const [state, setState] = useState<StoryPageState>({
    starterId: starterId || '',
    starterTitle: '',
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
  const [hasSeenOpening, setHasSeenOpening] = useState(false);
  const { submitStory, generateOpening, generateImage, fetchOpeningPrompt } = useStoryAPI();
  const {
    currentPageIndex,
    currentPage,
    canGoBack,
    canGoForward,
    isOnLatestPage,
    isOnOpeningPage,
    navigatePage
  } = usePageNavigation({ pages: state.pages });

  // One turn is one user input + one AI response.
  // After the opening, the first user input is turn 1.
  const [narrativeTurnCount, setNarrativeTurnCount] = useState(0);
  const maxTurns = 7; // Maximum turns before stopping conversation
  const [hasSentFinalMessage, setHasSentFinalMessage] = useState(false);
  const [conversationHasEnded, setConversationHasEnded] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
    },
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => {
      console.log('Message:', message);
      setNarrativeTurnCount(prev => {
        const newCount = message.source === "user" ? prev : prev + 1;
        console.log(`${message.source} message, count:`, newCount);
        return newCount;
      });

      if (message.source === "ai" && message.message.includes("<end>")) {
        console.log('Ending conversation due to <end> tag');
        setConversationHasEnded(true);
      }
    }
  });

  // Fetching opening image
  const fetchOpening = async () => {
    if (!state.openingText || !state.openingImage) return;

    try {
      const response = await fetch(state.openingImage);
      if (!response.ok) throw new Error('Failed to fetch opening image');
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching opening image:', error);
      return null;
    }
  };

  useEffect(() => {
    const startConversation = async () => {
      try {
        // Request microphone permission and store the stream
        await navigator.mediaDevices.getUserMedia({ audio: true });

        await conversation.startSession({
          agentId: process.env.NEXT_PUBLIC_ELEVENLABS_CONVERSATION_AGENT_ID!,
        });

        const openingPrompt = await fetchOpeningPrompt(category);
        if (openingPrompt) {
          // Send the opening prompt to the conversation
          conversation.sendUserMessage(openingPrompt);
        } else {
          console.error('Failed to fetch opening prompt');
        }

      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    startConversation();
  }, []);


  // Trigger end
  useEffect(() => {
    if (narrativeTurnCount >= maxTurns - 4 && !hasSentFinalMessage) {
      console.log("Sendt trigger to end conversation");
      conversation.sendContextualUpdate("<instruction>generate ending and end call</instruction>");
      setHasSentFinalMessage(true);
    }
  }, [narrativeTurnCount, maxTurns, hasSentFinalMessage, conversation]);


  useEffect(() => {
    const stopConversation = async () => {
      await conversation.endSession();
    }
    if (!conversation.isSpeaking && (narrativeTurnCount >= maxTurns || conversationHasEnded)) {
      console.log("Agent stopped speaking after story ended, disconnecting...");
      stopConversation();
    }
  }, [conversation, narrativeTurnCount, maxTurns, conversationHasEnded]);

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
              openingImage: `/scene_opening_${starter.category}.png`,
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

  // Mark opening as seen when it's first displayed on the opening page
  useEffect(() => {
    if (state.openingText && isOnOpeningPage && !hasSeenOpening) {
      setHasSeenOpening(true);
    }
  }, [state.openingText, isOnOpeningPage, hasSeenOpening]);

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
      const imagePrompt = `${input.trim()} ${result.nextStoryPart.trim()}`;
      const imageResult = await generateImage(imagePrompt, state.starterId || 'story', newPageId);

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
      <p>{`Turn ${narrativeTurnCount}`}</p>
      {/* Navigation Arrows */}
      <NavigationArrows
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNavigate={handleNavigation}
      />

      {/* Main Content Area - Takes remaining space above input */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full pt-16 pb-4 max-w-2xl mx-auto px-4 items-center">
          {/* Turn Indicator */}
          <TurnIndicator
            isUserTurn={state.isUserTurn}
            isGenerating={state.isGeneratingText || state.isGeneratingImage}
          />

          {/* Scrollable Content */}
          <div className="flex-1 w-full overflow-y-auto pb-4" ref={pageContentRef}>
            {/* Story Opening */}
            {state.openingText && isOnOpeningPage && (
              <StoryOpening
                title={state.starterTitle}
                openingText={state.openingText}
                imageUrl={state.openingImage}
                isAnimating={!hasSeenOpening}
              />
            )}

            {/* Current Page Content */}
            {currentPage && (
              <div>
                <PageContent
                  page={currentPage}
                />

                {/* Image Skeleton while generating */}
                {state.isGeneratingImage && isOnLatestPage && (
                  <div className="mt-6">
                    <ImageSkeleton />
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

          {/* Input Prompt - Fixed above input */}
          {showInputPrompt && (
            <div className="w-full text-center py-4">
              <p className="font-semibold text-gray-800">
                What happens next?
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Field - Fixed at bottom */}
      <div className="flex-none">
        <StoryInput
          value={state.currentInput}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isInputDisabled}
        />
      </div>
    </div>
  );
}

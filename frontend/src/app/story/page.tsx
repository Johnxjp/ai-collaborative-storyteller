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

  // Try to get story data from sessionStorage first, then fallback to URL params
  const [storyData, setStoryData] = useState<{
    title: string;
    opening_short: string;
    opening_long: string;
    category: string;
  } | null>(null);

  const startConversation = async (data: { title: string; opening_short: string; opening_long: string; category: string }) => {
    try {
      // Request microphone permission and store the stream
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const storyOpening = "Ready for story time? Let's begin. <story>" + data.opening_long + "</story> <prompt>What happens next?</prompt>";
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_CONVERSATION_AGENT_ID!,
        overrides: {
          agent: {
            firstMessage: storyOpening
          }
        }
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  useEffect(() => {
    // Check sessionStorage for story preview data
    const storedData = sessionStorage.getItem('storyPreview');
    if (storedData) {
      const data = JSON.parse(storedData);
      setStoryData(data);
      // Clear the data after using it
      sessionStorage.removeItem('storyPreview');
      
      // Start conversation immediately after setting data
      startConversation(data);
    }
  }, []);

  // Fallback to existing starter logic if no sessionStorage data
  const starter = storyStarters.find(s => s.id === starterId);
  const category = storyData?.category || (starter ? starter.category : 'adventure');
  // Track if opening has been shown to animate only on first view
  const [state, setState] = useState<StoryPageState>({
    starterId: starterId || '',
    starterTitle: storyData?.title || '',
    openingText: storyData?.opening_long || undefined,
    openingImage: undefined,
    isGeneratingOpening: false,
    pages: [],
    currentPageIndex: 0,
    currentInput: '',
    isGeneratingText: false,
    isGeneratingImage: false,
    errorMessage: null,
    isUserTurn: true,
    currentPageText: storyData?.opening_long || '',
    currentPageImage: null
  });

  // Update state when storyData is loaded from sessionStorage
  useEffect(() => {
    if (storyData) {
      setState(prev => ({
        ...prev,
        starterTitle: storyData.title,
        openingText: storyData.opening_long,
        currentPageText: storyData.opening_long
      }));
    }
  }, [storyData]);
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

  const extractTags = (message: string) => {
    // Extract the story text from the AI message
    const storyStartTag = '<story>';
    const storyEndTag = '</story>';
    const promptStartTag = '<prompt>';
    const promptEndTag = '</prompt>';
    const storyStartIndex = message.indexOf(storyStartTag);
    const storyEndIndex = message.indexOf(storyEndTag);
    const promptStartIndex = message.indexOf(promptStartTag);
    const promptEndIndex = message.indexOf(promptEndTag);
    const promptText = promptStartIndex !== -1 && promptEndIndex !== -1
      ? message.substring(promptStartIndex + promptStartTag.length, promptEndIndex).trim()
      : 'What happens next?';

    let storyText = '';
    if (storyStartIndex !== -1 && storyEndIndex !== -1) {
      // Extract story text between <story> tags
      storyText = message.substring(storyStartIndex + storyStartTag.length, storyEndIndex).trim();
    } else if (promptStartIndex !== -1) {
      storyText = message.substring(0, promptStartIndex).trim();
    } else {
      // If no <story> or <prompt> tags, use the entire message as story text
      storyText = message.trim();
    }

    return {
      story: storyText,
      prompt: promptText
    };
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
    },
    onDisconnect: () => console.log('Disconnected'),
    onMessage: async (message) => {
      console.log('Message:', message);
      setNarrativeTurnCount(prev => {
        const newCount = message.source === "user" ? prev : prev + 1;
        console.log(`${message.source} message, count:`, newCount);
        return newCount;
      });

      // Image generation and story text extraction
      if (message.source === "ai") {
        const { story, prompt } = extractTags(message.message);
        setState(prev => ({ ...prev, currentPageText: story, currentInput: prompt }));

        const image = await generateImage("", state.starterId || 'story', currentPage?.id || uuidv4());
        setState(prev => ({ ...prev, currentPageImage: image.imageUrl }));
      }

      if (message.source === "ai" && message.message.includes("<end>")) {
        console.log('Ending conversation due to <end> tag');
        setConversationHasEnded(true);
      }
    }
  });



  // Trigger end
  useEffect(() => {
    if (narrativeTurnCount >= maxTurns - 4 && !hasSentFinalMessage) {
      console.log("Send trigger to end conversation");
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
          {/* <TurnIndicator
            isUserTurn={state.isUserTurn}
            isGenerating={state.isGeneratingText || state.isGeneratingImage}
          /> */}

          {/* Scrollable Content */}
          <div className="flex-1 w-full overflow-y-auto pb-4" ref={pageContentRef}>
            {/* Story Opening */}
            {state.openingText && isOnOpeningPage && (
              <StoryOpening
                title={state.starterTitle}
                openingText={state.currentPageText}
                imageUrl={state.currentPageImage || undefined}
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
          {!conversation.isSpeaking && state.currentInput && (
            <div className="w-full text-center py-4">
              <p className="font-semibold text-gray-800">
                {state.currentInput}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Field - Fixed at bottom */}
      {/* <div className="flex-none">
        <StoryInput
          value={state.currentInput}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isInputDisabled}
        />
      </div> */}
    </div>
  );
}

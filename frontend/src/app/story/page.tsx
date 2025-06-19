'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PageContent from '@/components/PageView/PageContent';
import NavigationArrows from '@/components/PageView/NavigationArrows';
import { useStoryAPI } from '@/hooks/useStoryAPI';
import { StoryPageState, Page } from '@/types/story';
import { useConversation } from '@elevenlabs/react';

export default function StoryPage() {

  // Fallback to existing starter logic if no sessionStorage data
  // Try to get story data from sessionStorage first, then fallback to URL params
  const [pageInputData, setPageInputData] = useState<{
    title: string;
    opening_short: string;
    opening_long: string;
    category: string;
  } | null>(null);

  const [state, setState] = useState<StoryPageState>({
    category: "",
    title: "",
    pages: [],
    currentPageNumber: null,
    nextPartPrompt: null,
    isUserTurn: true
  });

  // conversation state
  const [narrativeTurnCount, setNarrativeTurnCount] = useState(0);
  const maxTurns = 4; // Maximum turns before stopping conversation
  const [hasSentFinalMessage, setHasSentFinalMessage] = useState(false);
  const [conversationHasEnded, setConversationHasEnded] = useState(false);

  // Update state when pageInputData is loaded from sessionStorage
  useEffect(() => {
    console.log('Page input data updated:', pageInputData);
    if (pageInputData) {
      console.log('Page input data loaded:', pageInputData);

      // Page created twice when the AI response with the opening
      // const firstPage: Page = {
      //   id: uuidv4(),
      //   text: pageInputData.opening_long,
      //   imageUrl: null
      // };

      setState(prev => ({
        ...prev,
        category: pageInputData.category,
        title: pageInputData.title,
      }));
    }
  }, [pageInputData]);

  const startAgentConversation = async (data: { title: string; opening_short: string; opening_long: string; category: string }) => {
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
      setPageInputData(data);
      // Clear the data after using it
      sessionStorage.removeItem('storyPreview');

      // Start conversation immediately after setting data
      startAgentConversation(data);
    } else {
      console.log('No story data found in sessionStorage');
    }
  }, []);

  const { generateImage } = useStoryAPI();

  // Navigation logic
  const canGoBack = state.currentPageNumber !== null && state.currentPageNumber > 1;
  const canGoForward = state.currentPageNumber !== null && state.currentPageNumber < state.pages.length;

  const navigatePage = (direction: 'prev' | 'next') => {
    if (state.pages.length === 0 || state.currentPageNumber === null) return;

    setState(prev => {
      const newPageNumber = direction === 'prev'
        ? Math.max(1, prev.currentPageNumber! - 1)
        : Math.min(prev.pages.length, prev.currentPageNumber! + 1);

      return { ...prev, currentPageNumber: newPageNumber };
    });
  };

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
      storyText = "";
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
        if (story.length > 0) {
          const newPageId = uuidv4(); // Generate a unique ID for the new page
          const newPage: Page = {
            id: newPageId,
            text: story,
            imageUrl: null // Image will be set after generation
          };
          setState(prevState => {
            const newPageNumber = prevState.pages.length + 1;
            return {
              ...prevState,
              nextPartPrompt: prompt,
              pages: [...prevState.pages, newPage],
              currentPageNumber: newPageNumber
            };
          });

          generateImage("", 'story', newPageId)
            .then(image => {
              // Update only the specific page by ID
              setState(prevState => (
                {
                  ...prevState,
                  pages: prevState.pages.map(page =>
                    page.id === newPageId
                      ? {
                        ...page,
                        imageUrl: image.imageUrl,
                      }
                      : page
                  )
                }));
              console.log(`Image loaded for page ${newPageId}`);
            })
            .catch(error => {
              console.error(`Failed to generate image for page ${newPageId}:`, error);
            });
        }
      }

      if (message.source === "ai" && message.message.includes("<end>")) {
        console.log('Ending conversation due to <end> tag');
        setConversationHasEnded(true);
      }
    }
  });

  // useEffect(() => {
  //   console.log("Pages", state.pages);
  // }, [state.pages]);


  // Trigger end
  useEffect(() => {
    if (narrativeTurnCount >= maxTurns - 1 && !hasSentFinalMessage) {
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

  const handleNavigation = (direction: 'prev' | 'next') => {
    navigatePage(direction);
  };

  return (
    <div className="h-screen flex flex-col relative">
      <NavigationArrows
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNavigate={handleNavigation}
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full pt-16 pb-4 max-w-2xl mx-auto px-4 items-center">
          <div className="flex-1 w-full overflow-y-auto pb-4">
            <h1 className="text-center text-lg font-bold py-4 text-gray-800">{state.title}</h1>
            <div>
              {(state.currentPageNumber !== null) && (
                <div>
                  <PageContent
                    page={state.pages[state.currentPageNumber - 1]}
                  />
                </div>
              )}
            </div>
          </div>
          {!conversation.isSpeaking && state.nextPartPrompt !== null && (
            <div className="w-full text-center py-4 mb-10 rounded-xl bg-blue-600 shadow-lg">
              <p className="font-semibold text-white">
                {state.nextPartPrompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}

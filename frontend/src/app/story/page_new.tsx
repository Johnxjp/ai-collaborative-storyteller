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

    const { submitStory, retryLastRequest } = useStoryAPI();

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

                generateOpening(starter.category, starter.title);
            }
        }
    }, [starterId, state.openingText]);

    const generateOpening = async (category: string, title: string) => {
        try {
            // For now, use predefined openings since backend endpoint isn't implemented yet
            const openings = {
                adventure: "You stand at the edge of a mysterious island, waves crashing against ancient rocks. A weathered map in your hand points to an X marking the spot where countless treasures await. The salty air carries whispers of adventures past and the promise of riches beyond imagination.",
                space: "The countdown reaches zero and your rocket ship blasts off into the starlit sky! Through the porthole, Earth grows smaller as you zoom past planets and dancing comets. Your destination: a mysterious planet where no human has ever set foot before.",
                fantasy: "Stepping through the morning mist, you discover a magical marketplace where nothing is quite as it seems. Floating lanterns cast rainbow shadows, and the air shimmers with enchantment. A friendly wizard waves you over to their stall filled with glowing potions and mysterious artifacts.",
                cooking: "You put on your chef's hat and step into the most amazing kitchen you've ever seen! Pots and pans seem to move on their own, spices dance in the air, and a talking wooden spoon offers to be your sous chef. Today, you're going to create something truly magical.",
                sports: "The crowd roars as you step onto the field for the championship game. This is the moment you've trained for your entire life. The ball is at your feet, your teammates are counting on you, and victory is within reach. The whistle blows and the game begins!"
            };

            const openingText = openings[category as keyof typeof openings] || "Your adventure begins now...";

            setState(prev => ({
                ...prev,
                openingText,
                openingImage: `/scene_opening_${category}.png`, // Use category-specific opening image
                isGeneratingOpening: false
            }));
        } catch (error) {
            console.error('Failed to generate opening:', error);
            setState(prev => ({
                ...prev,
                errorMessage: 'Failed to generate story opening',
                isGeneratingOpening: false
            }));
        }
    };

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

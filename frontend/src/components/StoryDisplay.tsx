'use client';

import { useEffect, useRef } from 'react';
import { useTextAnimation } from '@/hooks/useTextAnimation';

interface StoryDisplayProps {
    story: string;
    turnCount: number;
}

export default function StoryDisplay({ story, turnCount }: StoryDisplayProps) {
    const storyRef = useRef<HTMLDivElement>(null);
    const lastStoryLength = useRef(0);
    const { animateText } = useTextAnimation();

    useEffect(() => {
        if (storyRef.current && story) {
            const words = story.split(' ');

            // Only process new words that haven't been displayed yet
            const newWords = words.slice(lastStoryLength.current);

            if (newWords.length > 0) {
                // Check if we need a new paragraph
                const shouldCreateNewParagraph = turnCount % 4 === 0
                let targetParagraph: HTMLParagraphElement;

                if (shouldCreateNewParagraph || storyRef.current.children.length === 0) {
                    // Create new paragraph
                    targetParagraph = document.createElement('p');
                    targetParagraph.className = 'mb-4';
                    storyRef.current.appendChild(targetParagraph);
                } else {
                    // Use the last paragraph
                    targetParagraph = storyRef.current.lastElementChild as HTMLParagraphElement;
                }

                // Determine if this is user text (odd turns) or AI text (even turns)
                const isUserText = turnCount % 2 === 1;

                // Animate only the new words
                newWords.forEach((word, batchIndex) => {
                    animateText(word, lastStoryLength.current + batchIndex, batchIndex, targetParagraph, isUserText);
                });

                // Update our tracking
                lastStoryLength.current = words.length;
            }
        }
    }, [story, turnCount, animateText]);

    return (
        <div className="h-full overflow-y-auto pb-32">
            <div
                ref={storyRef}
                className="text-lg leading-relaxed"
                style={{ minHeight: '100px', fontSize: '30px' }}
            >
                {!story && (
                    <p className="text-gray-500 text-center italic">
                        Start your story
                    </p>
                )}
            </div>
        </div>
    );
}
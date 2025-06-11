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
    const lastTurnCount = useRef(0);
    const { animateText } = useTextAnimation();

    useEffect(() => {
        console.log('StoryDisplay received:', {
            storyLength: story.length,
            turnCount
        });

        if (storyRef.current && story) {
            const words = story.split(' ');
            console.log(words, lastStoryLength.current, turnCount);

            // Only process new words that haven't been displayed yet
            const newWords = words.slice(lastStoryLength.current);

            if (newWords.length > 0) {
                // Always create a new paragraph for each new turn to ensure proper interleaving
                const targetParagraph = document.createElement('p');
                targetParagraph.className = 'mb-4';
                targetParagraph.setAttribute('data-turn', turnCount.toString()); // Mark which turn this paragraph belongs to
                storyRef.current.appendChild(targetParagraph);

                // Determine if this is user text (odd turns) or AI text (even turns)
                const isUserText = turnCount % 2 === 1;

                // Animate only the new words
                newWords.forEach((word, batchIndex) => {
                    animateText(word, lastStoryLength.current + batchIndex, batchIndex, targetParagraph, isUserText);
                });

                // Update our tracking
                lastStoryLength.current = words.length;

                // Add image after AI turns (even turn counts)
                if (turnCount % 2 === 0 && turnCount > lastTurnCount.current && turnCount > 0) {
                    const imageIndex = turnCount; // Use turnCount directly since we have scene_2.png, scene_4.png, scene_6.png
                    console.log(`Adding image for turn ${turnCount}, trying scene_${imageIndex}.png`);

                    setTimeout(() => {
                        const imageContainer = document.createElement('div');
                        imageContainer.className = 'flex justify-center my-6';
                        imageContainer.setAttribute('data-image-container', 'true'); // Mark as image container

                        const img = document.createElement('img');
                        img.src = `/scene_${imageIndex}.png`;
                        img.alt = `Scene ${turnCount}`;
                        img.className = 'max-w-full h-auto rounded-lg shadow-lg';
                        img.style.maxHeight = '300px';

                        img.onload = () => {
                            console.log(`Image loaded successfully: scene_${imageIndex}.png`);
                        };
                        img.onerror = () => {
                            console.error(`Failed to load image: scene_${imageIndex}.png`);
                            // Show placeholder if image fails to load
                            imageContainer.innerHTML = `
                                <div class="w-full max-w-md h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                                    Scene ${turnCount} - Image not available
                                </div>
                            `;
                        };

                        imageContainer.appendChild(img);

                        // Ensure we append to the main story container, not inside a paragraph
                        if (storyRef.current) {
                            storyRef.current.appendChild(imageContainer);
                            console.log(`Image container appended to DOM for scene_${imageIndex}.png`);
                        }
                    }, newWords.length * 200); // Wait for all words to animate
                }

                lastTurnCount.current = turnCount;
            }
        }
    }, [story, turnCount, animateText]);

    return (
        <div className="h-full overflow-y-auto pb-32 mb-3">
            <div
                ref={storyRef}
                className="text-lg leading-relaxed"
                style={{ minHeight: '100px', fontSize: '30px' }}
            >
            </div>
        </div>
    );
}
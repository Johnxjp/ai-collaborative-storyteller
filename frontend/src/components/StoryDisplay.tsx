'use client';

import { useEffect, useRef } from 'react';
import { useTextAnimation } from '@/hooks/useTextAnimation';

interface StoryDisplayProps {
    story: string;
    turnCount: number;
    images: string[];
    isLoadingImage: boolean;
}

export default function StoryDisplay({ story, turnCount, images, isLoadingImage }: StoryDisplayProps) {
    const storyRef = useRef<HTMLDivElement>(null);
    const lastStoryLength = useRef(0);
    const lastTurnCount = useRef(0);
    const { animateText } = useTextAnimation();

    useEffect(() => {
        if (storyRef.current && story) {
            const words = story.split(' ');
            console.log(words, lastStoryLength.current, turnCount);

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

                // Add image after AI turns (even turn counts)
                if (turnCount % 2 === 0 && turnCount > lastTurnCount.current) {
                    const imageIndex = Math.floor(turnCount / 2) - 1;
                    if (images[imageIndex]) {
                        setTimeout(() => {
                            const imageContainer = document.createElement('div');
                            imageContainer.className = 'flex justify-center my-6';

                            const img = document.createElement('img');
                            img.src = images[imageIndex];
                            img.alt = `Scene ${imageIndex + 1}`;
                            img.className = 'max-w-full h-auto rounded-lg shadow-lg';
                            img.style.maxHeight = '300px';

                            imageContainer.appendChild(img);
                            storyRef.current?.appendChild(imageContainer);
                        }, newWords.length * 200); // Wait for all words to animate
                    }
                }

                lastTurnCount.current = turnCount;
            }
        }

        // Handle loading state for new images
        if (isLoadingImage && turnCount % 2 === 0) {
            const shouldShowLoader = !images[Math.floor(turnCount / 2) - 1];
            if (shouldShowLoader && storyRef.current) {
                setTimeout(() => {
                    const loaderContainer = document.createElement('div');
                    loaderContainer.className = 'flex justify-center my-6';
                    loaderContainer.id = 'image-loader';

                    const loader = document.createElement('div');
                    loader.className = 'w-full max-w-md h-48 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse';
                    loader.innerHTML = '<div class="text-gray-500">Loading scene image...</div>';

                    loaderContainer.appendChild(loader);
                    storyRef.current?.appendChild(loaderContainer);
                }, 200);
            }
        } else {
            // Remove loader when image loads
            const loader = storyRef.current?.querySelector('#image-loader');
            if (loader) {
                loader.remove();
            }
        }
    }, [story, turnCount, images, isLoadingImage, animateText]);

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
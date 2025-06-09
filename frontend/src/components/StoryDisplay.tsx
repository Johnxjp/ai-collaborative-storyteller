'use client';

import { useEffect, useRef } from 'react';
import { useTextAnimation } from '@/hooks/useTextAnimation';

interface StoryDisplayProps {
    story: string;
    turnCount: number;
}

export default function StoryDisplay({ story }: StoryDisplayProps) {
    const storyRef = useRef<HTMLDivElement>(null);
    const { animateText } = useTextAnimation();

    useEffect(() => {
        if (storyRef.current && story) {
            // Clear existing content
            storyRef.current.innerHTML = '';

            // Split story into paragraphs every 4 turns
            const words = story.split(' ');
            let currentParagraph = '';
            let wordIndex = 0;

            words.forEach((word, index) => {
                currentParagraph += word + ' ';

                // Add paragraph break every ~100 words or at natural breaks
                if ((index + 1) % 100 === 0 || word.endsWith('.') && (index + 1) % 50 === 0) {
                    const p = document.createElement('p');
                    p.className = 'mb-4';
                    storyRef.current?.appendChild(p);

                    // Animate words in this paragraph
                    const paragraphWords = currentParagraph.trim().split(' ');
                    paragraphWords.forEach((w, i) => {
                        animateText(w, wordIndex + i, p);
                    });

                    wordIndex += paragraphWords.length;
                    currentParagraph = '';
                }
            });

            // Handle remaining words
            if (currentParagraph.trim()) {
                const p = document.createElement('p');
                p.className = 'mb-4';
                storyRef.current?.appendChild(p);

                const remainingWords = currentParagraph.trim().split(' ');
                remainingWords.forEach((w, i) => {
                    animateText(w, wordIndex + i, p);
                });
            }
        }
    }, [story, animateText]);

    return (
        <div className="h-full overflow-y-auto pb-32">
            <div
                ref={storyRef}
                className="text-lg leading-relaxed"
                style={{ minHeight: '100px' }}
            >
                {!story && (
                    <p className="text-gray-500 text-center italic">
                        Start your story by typing something below...
                    </p>
                )}
            </div>
        </div>
    );
}

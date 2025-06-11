'use client';

import Image from 'next/image';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useState, useEffect } from 'react';

interface StoryOpeningProps {
    title: string;
    openingText: string;
    imageUrl?: string;
    isAnimating: boolean;
}

export default function StoryOpening({ title, openingText, imageUrl, isAnimating }: StoryOpeningProps) {
    const [showTitle, setShowTitle] = useState(false);
    const [showText, setShowText] = useState(false);
    const [showImage, setShowImage] = useState(false);

    const { animatedText } = useTextAnimation(
        openingText,
        isAnimating && showText,
        150
    );

    // Staggered animation timing
    useEffect(() => {
        if (isAnimating) {
            // Title appears immediately
            setTimeout(() => setShowTitle(true), 300);

            // Text starts animating after title
            setTimeout(() => setShowText(true), 800);

            // Image appears after text completes (estimate based on text length)
            const textDelay = openingText ? openingText.split(' ').length * 150 : 1000;
            setTimeout(() => setShowImage(true), 1500 + textDelay);
        } else {
            // Show everything immediately if not animating
            setShowTitle(true);
            setShowText(true);
            setShowImage(true);
        }
    }, [isAnimating, openingText]);

    // Helper function to render animated text with fade-in effect
    const renderAnimatedText = (fullText: string, animatedText: string) => {
        if (!isAnimating) {
            return fullText;
        }

        const words = fullText.split(' ');
        const animatedWords = animatedText.split(' ');

        return (
            <>
                {words.map((word, index) => {
                    const isVisible = index < animatedWords.length;
                    return (
                        <span key={index}>
                            <span
                                className={`transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                {word}
                            </span>
                            {index < words.length - 1 && ' '}
                        </span>
                    );
                })}
            </>
        );
    };

    return (
        <div className="mb-6 mt-6 max-h-90">
            {/* Animated Title */}
            <h1
                className={`text-start text-2xl font-bold py-4 text-gray-800 transition-opacity duration-1000 ease-in-out ${showTitle ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {title}
            </h1>

            {/* Animated Opening Text */}
            {openingText && (
                <div
                    className={`mb-4 transition-opacity duration-1000 ease-in-out ${showText ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <p className="text-lg leading-relaxed text-gray-700">
                        {renderAnimatedText(openingText, animatedText)}
                    </p>
                </div>
            )}

            {/* Animated Image */}
            {imageUrl && (
                <div
                    className={`flex justify-center my-6 py-6 transition-opacity duration-1000 ease-in-out ${showImage ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <Image
                        src={imageUrl}
                        alt="Story opening scene"
                        width={500}
                        height={400}
                        className="max-w-full h-auto rounded-lg shadow-lg"
                        style={{ maxHeight: '400px' }}
                    />
                </div>
            )}
        </div>
    );
}

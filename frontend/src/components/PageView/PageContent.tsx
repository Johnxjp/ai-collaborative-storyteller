'use client';

import Image from 'next/image';
import { Page } from '@/types/story';
import { useTextAnimation } from '@/hooks/useTextAnimation';

interface PageContentProps {
    page: Page;
    isAnimating: boolean;
}

export default function PageContent({ page, isAnimating }: PageContentProps) {
    const { animatedText: animatedUserText } = useTextAnimation(
        page.userText,
        isAnimating && page.userText.length > 0,
        200
    );

    const { animatedText: animatedAiText } = useTextAnimation(
        page.aiText,
        isAnimating && page.aiText.length > 0,
        200
    );

    // Helper function to render animated text with proper styling
    const renderAnimatedText = (fullText: string, animatedText: string, isUserText: boolean = false) => {
        if (!isAnimating || animatedText === fullText) {
            return fullText;
        }

        const words = fullText.split(' ');
        const animatedWords = animatedText.split(' ');

        return (
            <>
                {words.map((word, index) => {
                    const isVisible = index < animatedWords.length;
                    return (
                        <span
                            key={index}
                            className={`new-text ${isVisible ? 'fade-in' : ''} ${isUserText ? 'user-text' : ''}`}
                        >
                            {word}{index < words.length - 1 ? ' ' : ''}
                        </span>
                    );
                })}
            </>
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4 mt-6">
            {/* Text Content */}
            <div className="space-y-4 mb-6">
                {/* User Text - Bold */}
                {page.userText && (
                    <div className="text-lg leading-relaxed">
                        <p className="font-bold text-gray-800">
                            {renderAnimatedText(page.userText, animatedUserText, true)}
                        </p>
                    </div>
                )}

                {/* AI Text - Normal weight */}
                {page.aiText && (
                    <div className="text-lg leading-relaxed">
                        <p className="text-gray-700">
                            {renderAnimatedText(page.aiText, animatedAiText, false)}
                        </p>
                    </div>
                )}
            </div>

            {/* Image Section */}
            {page.imageUrl && (
                <div className="w-full aspect-[3/2]">
                    <Image
                        src={page.imageUrl}
                        alt={`Story scene for turn ${page.turnNumber}`}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                </div>
            )}
        </div>
    );
}

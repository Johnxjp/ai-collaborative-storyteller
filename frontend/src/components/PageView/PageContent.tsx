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

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            {/* Image Section */}
            {page.imageUrl && (
                <div className="w-full aspect-[3/2] mb-6">
                    <Image
                        src={page.imageUrl}
                        alt={`Story scene for turn ${page.turnNumber}`}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                </div>
            )}

            {/* Text Content */}
            <div className="space-y-4">
                {/* User Text - Bold */}
                {page.userText && (
                    <div className="text-lg leading-relaxed">
                        <p className="font-bold text-gray-800">
                            {isAnimating ? animatedUserText : page.userText}
                        </p>
                    </div>
                )}

                {/* AI Text - Normal weight */}
                {page.aiText && (
                    <div className="text-lg leading-relaxed">
                        <p className="text-gray-700">
                            {isAnimating ? animatedAiText : page.aiText}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

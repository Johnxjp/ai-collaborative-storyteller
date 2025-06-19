'use client';

import Image from 'next/image';
import { Page } from '@/types/story';
import AnimatedText from '@/components/AnimatedText';

interface PageContentProps {
    page: Page;
    displayImageSkeleton: boolean;
    onTextAnimationComplete?: () => void;
    wordDelay?: number;
    initialDelay?: number;
    fadeDuration?: number;
}

export default function PageContent({ 
    page, 
    displayImageSkeleton, 
    onTextAnimationComplete,
    wordDelay = 300,
    initialDelay = 500,
    fadeDuration = 400
}: PageContentProps) {
    const showImage = !page.isAnimating && (page.imageUrl || displayImageSkeleton);
    
    return (
        <div className="w-full max-w-2xl mx-auto px-4 mt-10">
            {/* Text Content */}
            <div className="space-y-4 mb-6">
                <div className="text-lg leading-relaxed">
                    <p>
                        {page.text && (
                            <AnimatedText
                                fullText={page.text}
                                isAnimating={page.isAnimating || false}
                                onAnimationComplete={onTextAnimationComplete}
                                wordDelay={wordDelay}
                                initialDelay={initialDelay}
                                fadeDuration={fadeDuration}
                            />
                        )}
                    </p>
                </div>
            </div>

            {/* Image Section - Only show after text animation completes */}
            {showImage && (
                <>
                    {page.imageUrl && (
                        <div className="w-full aspect-[3/2] opacity-0 animate-[fadeIn_800ms_ease-in-out_forwards]">
                            <Image
                                src={page.imageUrl}
                                alt={`Story scene for page ${page.id}`}
                                width={500}
                                height={333}
                                className="w-full h-full object-cover rounded-4xl shadow-lg"
                            />
                        </div>
                    )}
                    {!page.imageUrl && displayImageSkeleton && (
                        <div className="w-full aspect-[3/2] bg-gray-200 animate-pulse rounded-lg mb-4 flex items-center justify-center">
                            <p className="text-sm text-gray-200">Generating image...</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

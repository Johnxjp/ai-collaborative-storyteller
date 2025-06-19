'use client';

import Image from 'next/image';
import { Page } from '@/types/story';

interface PageContentProps {
    page: Page;
    displayImageSkeleton: boolean;
}

export default function PageContent({ page }: PageContentProps) {
    return (
        <div className="w-full max-w-2xl mx-auto px-4 mt-10">
            {/* Text Content */}
            <div className="space-y-4 mb-6">
                <div className="text-lg leading-relaxed">
                    <p>
                        {page.text && (
                            <span className="text-gray-800">
                                {page.text}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Image Section */}
            {page.imageUrl && (
                <div className="w-full aspect-[3/2]">
                    <Image
                        src={page.imageUrl}
                        alt={`Story scene for page ${page.id}`}
                        width={500}
                        height={333}
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                </div>
            )}
            {!page.imageUrl && (
                <div className="w-full aspect-[3/2] bg-gray-200 animate-pulse rounded-lg mb-4 flex items-center justify-center">
                    <p className="text-sm text-gray-200">Generating image...</p>
                </div>
            )}
        </div>
    );
}

'use client';

import Image from 'next/image';
import { Page } from '@/types/story';

interface PageContentProps {
    page: Page;
}

export default function PageContent({ page }: PageContentProps) {
    return (
        <div className="w-full max-w-2xl mx-auto px-4 mt-10">
            {/* Text Content */}
            <div className="space-y-4 mb-6">
                <div className="text-lg leading-relaxed">
                    <p>
                        {page.userText && (
                            <span className="font-bold text-gray-800">
                                {page.userText}
                            </span>
                        )}
                        {page.aiText && (
                            <span className="text-gray-600">
                                {' '}{page.aiText}
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
                        alt={`Story scene for turn ${page.turnNumber}`}
                        width={500}
                        height={333}
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                </div>
            )}
        </div>
    );
}

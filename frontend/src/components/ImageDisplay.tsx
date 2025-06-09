'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageDisplayProps {
    images: string[];
    isLoading: boolean;
}

export default function ImageDisplay({ images, isLoading }: ImageDisplayProps) {
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    const handleImageError = (imageUrl: string) => {
        setImageErrors(prev => new Set([...prev, imageUrl]));
    };

    if (images.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className="mt-8 space-y-4">
            {images.map((imageUrl, index) => (
                <div key={imageUrl} className="flex justify-center">
                    {!imageErrors.has(imageUrl) ? (
                        <Image
                            src={imageUrl}
                            alt={`Scene ${index + 1}`}
                            className="max-w-full h-auto rounded-lg shadow-lg animate-fade-in"
                            style={{ maxHeight: '300px' }}
                            width={500}
                            height={300}
                            onError={() => handleImageError(imageUrl)}
                            unoptimized
                        />
                    ) : (
                        <div className="w-full max-w-md h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                            <span>Scene {index + 1} - Image not available</span>
                        </div>
                    )}
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-center">
                    <div className="w-full max-w-md h-48 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
                        <div className="text-gray-500">Loading scene image...</div>
                    </div>
                </div>
            )}
        </div>
    );
}

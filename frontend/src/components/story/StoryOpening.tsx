'use client';

interface StoryOpeningProps {
    title: string;
    openingText: string;
    imageUrl?: string;
    isAnimating: boolean;
}

export default function StoryOpening({ title, openingText, imageUrl, isAnimating }: StoryOpeningProps) {
    return (
        <div className="mb-6">
            <h1 className="text-center text-2xl font-bold py-4 text-gray-800">
                {title}
            </h1>

            {openingText && (
                <div className="mb-4">
                    <p className="text-lg leading-relaxed text-gray-700">
                        {openingText}
                    </p>
                </div>
            )}

            {imageUrl && (
                <div className="flex justify-center my-4">
                    <img
                        src={imageUrl}
                        alt="Story opening scene"
                        className="max-w-full h-auto rounded-lg shadow-lg"
                        style={{ maxHeight: '200px' }}
                    />
                </div>
            )}

            {!isAnimating && (
                <p className="text-center text-gray-600 text-sm mb-4">
                    What happens next?
                </p>
            )}
        </div>
    );
}

'use client';

export default function ImageSkeleton() {
    return (
        <div className="w-full">
            <div className="w-full aspect-[3/2] bg-gray-200 animate-pulse rounded-lg mb-4 flex items-center justify-center">
                <p className="text-sm text-gray-200">Generating image...</p>
            </div>
        </div>
    );
}

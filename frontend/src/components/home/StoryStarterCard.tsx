'use client';

import Image from 'next/image';
import { StoryStarter } from '@/types/story';

interface StoryStarterCardProps {
    starter: StoryStarter;
    onClick: (starter: StoryStarter) => void;
}

export default function StoryStarterCard({ starter, onClick }: StoryStarterCardProps) {
    return (
        <div
            className="flex flex-col items-center cursor-pointer transform transition-transform hover:scale-105 active:scale-95"
            onClick={() => onClick(starter)}
        >
            <div className="w-50 h-50 rounded-lg bg-white flex items-center justify-center mb-2 shadow-lg overflow-hidden border-2 border-gray-100">
                <Image
                    src={starter.imagePath}
                    alt={starter.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded-lg"
                />
            </div>
            <h3 className="text-base font-medium text-center text-gray-800 leading-tight max-w-50">
                {starter.title}
            </h3>
        </div>
    );
}

'use client';

import { storyStarters } from '@/data/storyStarters';
import { StoryStarter } from '@/types/story';
import StoryStarterCard from './StoryStarterCard';

interface StoryStarterGridProps {
    onCategorySelect: (category: string) => void;
}

export default function StoryStarterGrid({ onCategorySelect }: StoryStarterGridProps) {
    const handleStarterClick = (starter: StoryStarter) => {
        onCategorySelect(starter.category);
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                Choose a Story Theme
            </h1>

            <div className="px-16 grid grid-cols-2 gap-4">
                {storyStarters.map((starter) => (
                    <StoryStarterCard
                        key={starter.id}
                        starter={starter}
                        onClick={handleStarterClick}
                    />
                ))}
            </div>
        </div>
    );
}

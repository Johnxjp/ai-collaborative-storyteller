'use client';

import { useRouter } from 'next/navigation';
import { storyStarters } from '@/data/storyStarters';
import { StoryStarter } from '@/types/story';
import StoryStarterCard from './StoryStarterCard';

export default function StoryStarterGrid() {
    const router = useRouter();

    const handleStarterClick = (starter: StoryStarter) => {
        router.push(`/story?starter=${starter.id}`);
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                Choose Your Adventure!
            </h1>

            <div className="grid grid-cols-2 gap-8 justify-items-center">
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

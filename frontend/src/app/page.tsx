'use client';

import { useState } from 'react';
import StoryStarterGrid from '@/components/home/StoryStarterGrid';
import StoryPreview from '@/components/home/StoryPreview';

interface StoryPreviewData {
  title: string;
  opening_short: string;
  opening_long: string;
}

export default function Home() {
  console.log('🏠 Home component loaded');
  
  const [category, setCategory] = useState<string | null>(null);
  const [storyPreview, setStoryPreview] = useState<StoryPreviewData | null>(null);

  const handleCategorySelect = (category: string) => {
    console.log('📂 Category selected:', category);
    setCategory(category);
  };

  const handleBackToGrid = () => {
    setCategory(null);
    setStoryPreview(null);
  };

  const handleStoryPreviewLoaded = (preview: StoryPreviewData) => {
    setStoryPreview(preview);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      {category ? (
        <StoryPreview
          category={category}
          onBack={handleBackToGrid}
          onStoryLoaded={handleStoryPreviewLoaded}
          storyPreview={storyPreview}
        />
      ) : (
        <StoryStarterGrid onCategorySelect={handleCategorySelect} />
      )}
    </div>
  );
}

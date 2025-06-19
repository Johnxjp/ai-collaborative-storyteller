'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StoryPreviewData {
  title: string;
  opening_short: string;
  opening_long: string;
}

interface StoryPreviewProps {
  category: string;
  onBack: () => void;
  onStoryLoaded: (preview: StoryPreviewData) => void;
  storyPreview: StoryPreviewData | null;
}

export default function StoryPreview({ category, onBack, onStoryLoaded, storyPreview }: StoryPreviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storyPreview && category) {
      const fetchStoryPreview = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const response = await fetch('http://localhost:8000/generate-opening', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              n: 1,
              category: category
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch story preview');
          }

          const data = await response.json();
          if (data.stories && data.stories.length > 0) {
            onStoryLoaded(data.stories[0]);
          } else {
            throw new Error('No stories returned');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      fetchStoryPreview();
    }
  }, [category, storyPreview, onStoryLoaded]);

  const handleBegin = () => {
    if (storyPreview) {
      sessionStorage.setItem('storyPreview', JSON.stringify({
        title: storyPreview.title,
        opening_short: storyPreview.opening_short,
        opening_long: storyPreview.opening_long,
        category: category
      }));
      router.push('/story');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 text-center">
        <div className="text-xl text-gray-600">Loading story preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 text-center">
        <div className="text-xl text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  if (!storyPreview) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 text-center">
        <div className="text-xl text-gray-600 mb-4">No story preview available</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {storyPreview.title}
        </h1>
        
        <div className="mb-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            {storyPreview.opening_short}
          </p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          
          <button
            onClick={handleBegin}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Begin →
          </button>
        </div>
      </div>
    </div>
  );
}
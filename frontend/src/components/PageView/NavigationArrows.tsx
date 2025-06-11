'use client';

interface NavigationArrowsProps {
    canGoBack: boolean;
    canGoForward: boolean;
    onNavigate: (direction: 'prev' | 'next') => void;
}

export default function NavigationArrows({ canGoBack, canGoForward, onNavigate }: NavigationArrowsProps) {
    return (
        <>
            {/* Left Arrow */}
            {canGoBack && (
                <button
                    onClick={() => onNavigate('prev')}
                    className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Previous page"
                >
                    <svg
                        className="w-6 h-6 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
            )}

            {/* Right Arrow */}
            {canGoForward && (
                <button
                    onClick={() => onNavigate('next')}
                    className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Next page"
                >
                    <svg
                        className="w-6 h-6 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            )}
        </>
    );
}

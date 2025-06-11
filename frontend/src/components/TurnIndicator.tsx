'use client';

interface TurnIndicatorProps {
    isUserTurn: boolean;
    isGenerating: boolean;
}

export default function TurnIndicator({ isUserTurn, isGenerating }: TurnIndicatorProps) {
    const getIndicatorText = () => {
        if (isGenerating) {
            return isUserTurn ? "Your pal's turn" : "Your pal's turn.";
        }
        return isUserTurn ? "Your turn" : "Your pal's turn";
    };

    const getIndicatorColor = () => {
        if (isUserTurn && !isGenerating) {
            return "bg-blue-500 text-white";
        }
        return "bg-red-200 text-gray-700";
    };

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className={`px-6 py-2 rounded-full transition-all duration-300 ${getIndicatorColor()}`}>
                <span className="text-sm font-medium">
                    {getIndicatorText()}
                </span>
            </div>
        </div>
    );
}

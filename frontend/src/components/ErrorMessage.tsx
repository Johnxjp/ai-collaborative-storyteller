'use client';

interface ErrorMessageProps {
    message: string;
    onRetry: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
            <div className="flex items-start space-x-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium mb-2">
                        {message}
                    </p>
                    <button
                        onClick={onRetry}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </div>
    );
}

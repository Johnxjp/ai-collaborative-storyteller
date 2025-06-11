'use client';

interface InputPromptProps {
    isVisible: boolean;
}

export default function InputPrompt({ isVisible }: InputPromptProps) {
    if (!isVisible) return null;

    return (
        <div className="text-center py-4">
            <p className="text-gray-600 text-sm font-medium">
                What happens next?
            </p>
        </div>
    );
}

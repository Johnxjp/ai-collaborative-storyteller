'use client';

import { useState, useCallback } from 'react';

interface StoryInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (input: string) => void;
    disabled: boolean;
}

export default function StoryInput({ value, onChange, onSubmit, disabled }: StoryInputProps) {
    const MAX_CHARS = 1000;
    const [charCount, setCharCount] = useState(0);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= MAX_CHARS) {
            onChange(newValue);
            setCharCount(newValue.length);
        }
    }, [onChange]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !disabled) {
            onSubmit(value.trim());
            setCharCount(0);
        }
    }, [value, disabled, onSubmit]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }, [handleSubmit]);

    return (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span className={charCount > MAX_CHARS * 0.9 ? 'text-red-500' : ''}>
                            {charCount}/{MAX_CHARS}
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <textarea
                            value={value}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            disabled={disabled}
                            placeholder="What happens next?"
                            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            rows={3}
                        />

                        <button
                            type="submit"
                            disabled={disabled || !value.trim() || charCount > MAX_CHARS}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed self-end"
                        >
                            {disabled ? 'Wait...' : 'Add'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

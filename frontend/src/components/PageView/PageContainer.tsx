'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
    return (
        <div className={`page-content-container ${className}`}>
            <style jsx>{`
                .page-content-container {
                    height: calc(100vh - 200px);
                    overflow-y: auto;
                    scroll-behavior: smooth;
                }

                .page-content-container::-webkit-scrollbar {
                    width: 6px;
                }

                .page-content-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }

                .page-content-container::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 3px;
                }

                .page-content-container::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
            {children}
        </div>
    );
}

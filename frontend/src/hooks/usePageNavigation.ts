'use client';

import { useState, useCallback, useEffect } from 'react';
import { Page } from '@/types/story';

interface UsePageNavigationProps {
    pages: Page[];
    maxPages?: number;
}

export const usePageNavigation = ({ pages, maxPages = 100 }: UsePageNavigationProps) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Auto-navigate to latest page when new pages are added
    useEffect(() => {
        if (pages.length > 0) {
            setCurrentPageIndex(pages.length - 1);
        }
    }, [pages.length]);

    const navigatePage = useCallback((direction: 'prev' | 'next') => {
        const newIndex = direction === 'prev'
            ? Math.max(0, currentPageIndex - 1)
            : Math.min(pages.length - 1, currentPageIndex + 1);

        setCurrentPageIndex(newIndex);
    }, [currentPageIndex, pages.length]);

    const navigateToPage = useCallback((index: number) => {
        const clampedIndex = Math.max(0, Math.min(pages.length - 1, index));
        setCurrentPageIndex(clampedIndex);
    }, [pages.length]);

    const canGoBack = currentPageIndex > 0;
    const canGoForward = currentPageIndex < pages.length - 1;
    const currentPage = pages[currentPageIndex] || null;
    const isOnLatestPage = pages.length === 0 || currentPageIndex === pages.length - 1;

    // Memory management - limit stored pages
    const managedPages = pages.length > maxPages
        ? pages.slice(-maxPages)
        : pages;

    return {
        currentPageIndex,
        currentPage,
        canGoBack,
        canGoForward,
        isOnLatestPage,
        navigatePage,
        navigateToPage,
        pages: managedPages
    };
};

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Page } from '@/types/story';

interface UsePageNavigationProps {
    pages: Page[];
    maxPages?: number;
}

export const usePageNavigation = ({ pages, maxPages = 100 }: UsePageNavigationProps) => {
    // currentPageIndex: -1 = opening page, 0+ = regular pages
    const [currentPageIndex, setCurrentPageIndex] = useState(-1);

    // Auto-navigate to latest page when new pages are added
    useEffect(() => {
        if (pages.length > 0) {
            setCurrentPageIndex(pages.length - 1);
        }
    }, [pages.length]);

    const navigatePage = useCallback((direction: 'prev' | 'next') => {
        const newIndex = direction === 'prev'
            ? Math.max(-1, currentPageIndex - 1)  // Allow going back to opening (-1)
            : Math.min(pages.length - 1, currentPageIndex + 1);

        setCurrentPageIndex(newIndex);
    }, [currentPageIndex, pages.length]);

    const navigateToPage = useCallback((index: number) => {
        const clampedIndex = Math.max(-1, Math.min(pages.length - 1, index));
        setCurrentPageIndex(clampedIndex);
    }, [pages.length]);

    const canGoBack = currentPageIndex > -1;  // Can go back if not on opening page
    const canGoForward = currentPageIndex < pages.length - 1;
    const currentPage = currentPageIndex >= 0 ? pages[currentPageIndex] || null : null;
    const isOnLatestPage = pages.length === 0 || currentPageIndex === pages.length - 1;
    const isOnOpeningPage = currentPageIndex === -1;

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
        isOnOpeningPage,
        navigatePage,
        navigateToPage,
        pages: managedPages
    };
};

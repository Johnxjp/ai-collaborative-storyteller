export interface StoryStarter {
    id: string;
    title: string;
    imagePath: string;
    category: string;
}

export interface Page {
    id: string;
    userText: string;
    aiText: string;
    imageUrl: string | null;
    isComplete: boolean;
    turnNumber: number;
}

export interface StoryPageState {
    starterId?: string;
    starterTitle: string;
    openingText?: string;
    openingImage?: string;
    isGeneratingOpening: boolean;
    pages: Page[];
    currentPageIndex: number;
    currentInput: string;
    isGeneratingText: boolean;
    isGeneratingImage: boolean;
    errorMessage: string | null;
    isUserTurn: boolean;
}

export interface OpeningResponse {
    opening_text: string;
    image_prompt: string;
    title: string;
}

export interface ImageResponse {
    imageUrl: string;
}

export interface ImageRequest {
    prompt: string;
    story_id: string;
    page_id: string;
    style_hints?: string;
}

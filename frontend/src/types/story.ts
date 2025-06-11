export interface StoryStarter {
    id: string;
    title: string;
    imagePath: string;
    category: string;
}

export interface StoryPageState {
    starterId?: string;
    starterTitle?: string;
    openingText?: string;
    openingImage?: string;
    isGeneratingOpening: boolean;
    story: string;
    userInput: string;
    isLoading: boolean;
    errorMessage: string | null;
    turnCount: number;
}

export interface OpeningResponse {
    opening_text: string;
    image_prompt: string;
    title: string;
}

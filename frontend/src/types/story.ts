export interface StoryStarter {
    id: string;
    title: string;
    imagePath: string;
    category: string;
}

export interface Page {
    id: string;
    text: string;
    imageUrl: string | null;
}

export interface StoryPageState {
    category: string;
    title: string;
    pages: Page[];
    currentPageNumber: number | null;
    nextPartPrompt: string | null;
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

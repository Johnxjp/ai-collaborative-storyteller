import { storyWelcomeText } from "./data/storyStarters"

export const generateFirstMessage = (storyText: string, prompt: string): string => {
  const randomWelcomeMessage = storyWelcomeText[Math.floor(Math.random() * storyWelcomeText.length)];
  return `${randomWelcomeMessage} <story>${storyText}</story><prompt>${prompt}</prompt>`;
};
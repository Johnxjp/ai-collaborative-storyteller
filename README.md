# Collaborative Storytelling Application

A real-time collaborative storytelling application where users and AI take turns building a story together.

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Python FastAPI with OpenAI GPT-4o-mini
- **Package Managers**: npm (frontend), uv (backend)

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.12+
- uv (Python package manager)
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file with your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Start the development server:
   ```bash
   uv run fastapi dev main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## How to Use

1. Open `http://localhost:3000` in your browser
2. Type the beginning of your story in the input field
3. Click "Add" to submit your contribution
4. Watch as the AI continues the story with word-by-word animation
5. Continue the collaborative storytelling!

## Features

- ✅ Real-time story collaboration with AI
- ✅ Word-by-word text animation (200ms delays)
- ✅ Character limit validation (1000 characters)
- ✅ Loading indicators with animated thinking emojis
- ✅ Error handling with retry functionality
- ✅ Responsive design
- ✅ Automatic paragraph breaks
- ✅ Streaming AI responses

## API Endpoints

### Backend (Port 8000)

- `POST /generate-story` - Generate AI story continuation
- `GET /health` - Health check endpoint

### Request Format

```json
{
  "entire_story": "Story so far...",
  "user_input": "User's latest addition"
}
```

### Response Format

Server-sent events with JSON chunks:
```
data: {"content": "word"}
data: {"done": true}
```

## Development

Both servers support hot-reload:
- Frontend: Automatically reloads on file changes
- Backend: Automatically reloads on file changes with `--reload` flag

The application follows the specification exactly as defined in `story_app_spec.md`.

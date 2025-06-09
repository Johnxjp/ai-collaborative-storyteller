import os
import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import openai


# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
import openai

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class StoryRequest(BaseModel):
    entire_story: str
    user_input: str


@app.post("/generate-story")
async def generate_story(request: StoryRequest):
    try:
        # Construct the prompt
        system_prompt = """You are a creative storytelling assistant. Your job is to continue a collaborative story naturally and engagingly. Keep your contributions concise but meaningful, around 1-3 sentences. Match the tone and style of the existing story. Be creative but maintain narrative coherence."""

        user_prompt = f"""Story so far: {request.entire_story}

Latest user addition: {request.user_input}

Continue the story naturally from where it left off."""

        # Create OpenAI streaming response
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            max_tokens=150,
            temperature=0.8,
        )

        async def generate():
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    # Send as Server-Sent Events format
                    yield f"data: {json.dumps({'content': content})}\n\n"

            # Send end signal
            yield f"data: {json.dumps({'done': True})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

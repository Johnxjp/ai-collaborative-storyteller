import os
import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel


from prompts import system_prompt, user_prompt_template

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

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class StoryRequest(BaseModel):
    story: str


dummy_ai_responses = [
    "She was best friends with a yellow dragon named Spark.",
    "They were all happy together.",
    "Suddenly, there was a big big cave in the middle of the forest.",
]
dummy_ai_responses_iter = iter(dummy_ai_responses)


@app.post("/generate-story")
async def generate_story(request: StoryRequest):
    global dummy_ai_responses_iter
    next_response = next(dummy_ai_responses_iter, None)
    if next_response is None:
        dummy_ai_responses_iter = iter(dummy_ai_responses)
        next_response = next(dummy_ai_responses_iter, None)
    try:
        # Construct the prompt
        user_prompt = user_prompt_template.format(story=request.story.strip())

        # Create OpenAI streaming response
        # stream = client.responses.create(
        #     model="gpt-4o-mini",
        #     instructions=system_prompt,
        #     input=user_prompt,
        #     stream=True,
        #     max_output_tokens=150,
        #     temperature=0.8,
        # )

        def generate():
            for event in next_response:
                # if event.type == "response.output_text.delta":
                #     content = event.delta
                yield f"data: {json.dumps({'content': event})}\n\n"

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

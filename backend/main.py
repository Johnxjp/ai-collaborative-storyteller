import os
import json
import asyncio
import time

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
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ImageRequest(BaseModel):
    page_content: str
    turn_number: int
    style_hints: str = None


class ImageResponse(BaseModel):
    image_url: str
    generation_time: float


class OpeningRequest(BaseModel):
    category: str
    title: str


class OpeningResponse(BaseModel):
    opening_text: str
    image_prompt: str
    title: str


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


@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        import time

        # For now, return a placeholder image URL since we don't have actual image generation
        # In production, this would call DALL-E or similar service

        # Create a simple prompt from the page content
        prompt = f"Child-friendly illustration: {request.page_content[:100]}..."

        # Simulate image generation delay
        await asyncio.sleep(1)

        # Return a placeholder image URL (using scene images for now)
        scene_images = [
            "/scene_opening_adventure.svg",
            "/scene_opening_space.svg",
            "/scene_opening_fantasy.svg",
            "/scene_opening_cooking.svg",
            "/scene_opening_sports.svg",
        ]

        # Use turn number to cycle through available images
        image_index = (request.turn_number - 1) % len(scene_images)
        image_url = scene_images[image_index]

        return ImageResponse(image_url=image_url, generation_time=time.time())

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-opening")
async def generate_opening(request: OpeningRequest):
    try:
        # Predefined openings based on category
        openings = {
            "adventure": "You stand at the edge of a mysterious island, waves crashing against ancient rocks. A weathered map in your hand points to an X marking the spot where countless treasures await. The salty air carries whispers of adventures past and the promise of riches beyond imagination.",
            "space": "The countdown reaches zero and your rocket ship blasts off into the starlit sky! Through the porthole, Earth grows smaller as you zoom past planets and dancing comets. Your destination: a mysterious planet where no human has ever set foot before.",
            "fantasy": "Stepping through the morning mist, you discover a magical marketplace where nothing is quite as it seems. Floating lanterns cast rainbow shadows, and the air shimmers with enchantment. A friendly wizard waves you over to their stall filled with glowing potions and mysterious artifacts.",
            "cooking": "You put on your chef's hat and step into the most amazing kitchen you've ever seen! Pots and pans seem to move on their own, spices dance in the air, and a talking wooden spoon offers to be your sous chef. Today, you're going to create something truly magical.",
            "sports": "The crowd roars as you step onto the field for the championship game. This is the moment you've trained for your entire life. The ball is at your feet, your teammates are counting on you, and victory is within reach. The whistle blows and the game begins!",
        }

        opening_text = openings.get(request.category, "Your adventure begins now...")
        image_prompt = f"A beautiful, child-friendly illustration of {request.title.lower()}"

        return OpeningResponse(
            opening_text=opening_text, image_prompt=image_prompt, title=request.title
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

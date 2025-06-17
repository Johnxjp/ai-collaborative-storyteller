import base64
import os
import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel


from prompts import system_prompt, user_prompt_template, image_prompt_template, opening_prompt_template

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
    prompt: str
    story_id: str
    page_id: str


class ImageResponse(BaseModel):
    image_b64: str


class OpeningRequest(BaseModel):
    category: str
    title: str


class OpeningResponse(BaseModel):
    opening_text: str
    image_prompt: str
    title: str


class StoryRequest(BaseModel):
    story: str


# dummy_ai_responses = [
#     "She was best friends with a yellow dragon named Spark.",
#     "They were all happy together.",
#     "Suddenly, there was a big big cave in the middle of the forest.",
# ]
# dummy_ai_responses_iter = iter(dummy_ai_responses)


@app.post("/generate-story")
async def generate_story(request: StoryRequest):
    # global dummy_ai_responses_iter
    # next_response = next(dummy_ai_responses_iter, None)
    # if next_response is None:
    #     dummy_ai_responses_iter = iter(dummy_ai_responses)
    #     next_response = next(dummy_ai_responses_iter, None)
    try:
        # Construct the prompt
        user_prompt = user_prompt_template.format(story=request.story.strip())

        # Create OpenAI streaming response
        stream = client.responses.create(
            model="gpt-4o-mini",
            instructions=system_prompt,
            input=user_prompt,
            stream=True,
            max_output_tokens=150,
            temperature=0.8,
        )

        def generate():
            for event in stream:
                if event.type == "response.output_text.delta":
                    content = event.delta
                    yield f"data: {json.dumps({'content': content})}\n\n"

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

        # For now, return a placeholder image URL since we don't have actual image generation
        # In production, this would call DALL-E or similar service

        # Create a simple prompt from the page content
        image_format = "jpeg"
        prompt = image_prompt_template.format(description=request.prompt.strip())

        # Do not change image settings
        result = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            output_format=image_format,
            quality="low",
            size="1536x1024",
        )

        image_base64 = result.data[0].b64_json
        image_bytes = base64.b64decode(image_base64)
        image_filename = f"{request.story_id}_{request.page_id}.{image_format}"
        image_path = os.path.join("images", image_filename)
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        with open(image_path, "wb") as image_file:
            image_file.write(image_bytes)

        # Return a placeholder image URL (using scene images for now)
        # scene_images = [
        #     "/scene_opening_adventure.svg",
        #     "/scene_opening_space.svg",
        #     "/scene_opening_fantasy.svg",
        #     "/scene_opening_cooking.svg",
        #     "/scene_opening_sports.svg",
        # ]

        # Use turn number to cycle through available images
        # image_index = (request.turn_number - 1) % len(scene_images)
        # image_url = scene_images[image_index]
        return ImageResponse(image_b64=image_base64)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/opening-prompt")
def get_opening_prompt(category: str):
    """
    Get the opening prompt for a specific category.
    """
    try:
        opening_prompt = opening_prompt_template.format(category=category)
        return {"prompt": opening_prompt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-opening")
async def generate_opening(request: OpeningRequest):
    # try:
    # # Construct the prompt
    #     user_prompt = user_prompt_template.format(story=request.story.strip())

    #     # Create OpenAI streaming response
    #     stream = client.responses.create(
    #         model="gpt-4o-mini",
    #         instructions=system_prompt,
    #         input=user_prompt,
    #         stream=True,
    #         max_output_tokens=150,
    #         temperature=0.8,
    #     )

    #     def generate():
    #         for event in stream:
    #             if event.type == "response.output_text.delta":
    #                 content = event.delta
    #                 yield f"data: {json.dumps({'content': content})}\n\n"

    #         yield f"data: {json.dumps({'done': True})}\n\n"

    #     return StreamingResponse(
    #         generate(),
    #         media_type="text/plain",
    #         headers={
    #             "Cache-Control": "no-cache",
    #             "Connection": "keep-alive",
    #             "Content-Type": "text/event-stream",
    #         },
    #     )
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))

    try:
        # Predefined openings based on category
        openings = {
            "adventure": "You stand at the edge of a mysterious island, waves crashing against ancient rocks. A weathered map in your hand points to an X marking the spot where countless treasures await. The salty air carries whispers of adventures past and the promise of riches beyond imagination.",
            "space": "A little red and white rocket ship zoomed through the starry sky, carrying a brave little astronaut named Luna. She had packed her favorite teddy bear and some space snacks for the big adventure.",
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

import base64
import random
import os
import traceback

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import OpenAI
from pydantic import BaseModel, Field, ValidationError


from data import STORY_OPENINGS
from prompts import (
    image_prompt_template,
    opening_prompt_template,
)

# Load environment variables
load_dotenv()

app = FastAPI(debug=True)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Railway deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ImageRequest(BaseModel):
    scene_description: str
    story_id: str
    page_id: str


class ImageResponse(BaseModel):
    image_url: str


class OpeningRequest(BaseModel):
    category: str
    n: int = 3


class StoryOpening(BaseModel):
    title: str = Field(description="A short creative title for the story.")
    opening_short: str = Field(
        description="A brief and intriguing opening for the story. No more than one sentence."
    )
    opening_long: str = Field(
        description="The opening for the story, setting the scene and introducing the main characters. No more than 3 sentences."
    )


class StoryOpeningResponse(BaseModel):
    stories: list[StoryOpening] = Field(
        description="A list of story openings generated based on the provided category."
    )


class StoryRequest(BaseModel):
    story: str


def generate_image_prompt(description: str) -> str:
    """
    Generate a prompt for image generation based on the description.
    """
    formatted_prompt = image_prompt_template.format(description=description.strip())
    response = client.responses.parse(
        model="gpt-4o-mini",
        input=[
            {"role": "user", "content": formatted_prompt},
        ],
    )
    return response.output_text


@app.post("/generate-image")
async def generate_image(request: ImageRequest) -> ImageResponse:
    try:

        # For now, return a placeholder image URL since we don't have actual image generation
        # In production, this would call DALL-E or similar service
        image_format = "jpeg"
        image_prompt = image_prompt_template.format(description=request.scene_description.strip())

        print(f"Generated image prompt: {image_prompt}")
        # Do not change image settings
        result = client.images.generate(
            model="gpt-image-1",
            prompt=image_prompt,
            output_format=image_format,
            quality="low",
            size="1024x1024",
        )

        image_base64 = result.data[0].b64_json
        image_bytes = base64.b64decode(image_base64)
        image_filename = f"{request.story_id}_{request.page_id}.{image_format}"
        image_path = os.path.join("images", image_filename)
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        with open(image_path, "wb") as image_file:
            image_file.write(image_bytes)

        # with open("images/rocket_53c6e543-0f09-4050-ad2d-fd234bdf9f65.jpeg", "rb") as image_file:
        #     image_bytes = image_file.read()

        # Return URL to the saved image file instead of base64
        image_url = f"/images/{image_filename}"
        return ImageResponse(image_url=image_url)

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
async def generate_opening(request: OpeningRequest) -> StoryOpeningResponse:
    try:
        # formatted_prompt = generate_stories_prompt_template.format(
        #     number_of_stories=request.n,
        #     category=request.category,
        # )
        # response = client.responses.parse(
        #     model="gpt-4o-mini",
        #     input=[
        #         {"role": "user", "content": formatted_prompt},
        #     ],
        #     text_format=StoryOpeningResponse,
        # )

        # result = response.output_parsed
        result = STORY_OPENINGS.get(request.category)
        result = {"stories": [random.choice(result)]}
        StoryOpeningResponse.model_validate(result)
        return result

    except ValidationError as e:
        print(f"Error in generate_opening: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        print(f"Error in generate_opening: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/images/{filename}")
async def serve_image(filename: str):
    """Serve generated images from the images directory"""
    file_path = f"images/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/jpeg")


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

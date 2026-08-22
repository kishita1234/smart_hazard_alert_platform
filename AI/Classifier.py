import os
import json
import mimetypes
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompt import WATERLOGGING_PROMPT

PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY was not found in .env"
    )

client = genai.Client(api_key=api_key)

def classify_image(image_path):

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    # Detect image format
    mime_type, _ = mimetypes.guess_type(image_path)

    if not mime_type or not mime_type.startswith("image/"):
        raise ValueError(
            f"Unsupported image type: {image_path}"
        )

    # Read image
    image_bytes = image_path.read_bytes()

    response_schema = {
        "type": "OBJECT",

        "properties": {

            "type": {
                "type": "STRING",
                "enum": [
                    "waterlogging",
                    "no_waterlogging",
                    "unverified"
                ]
            },

            "severity": {
                "type": "INTEGER",
                "minimum": 0,
                "maximum": 4
            },

            "confidence": {
                "type": "NUMBER",
                "minimum": 0,
                "maximum": 1
            },

            "reasoning": {
                "type": "STRING"
            }
        },

        "required": [
            "type",
            "severity",
            "confidence",
            "reasoning"
        ]
    }

    response = client.models.generate_content(

        model="gemini-3.6-flash",

        contents=[

            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            ),

            WATERLOGGING_PROMPT
        ],

        config=types.GenerateContentConfig(

            response_mime_type="application/json",

            response_schema=response_schema,

            temperature=0
        )
    )

    result = json.loads(response.text)

    if result["confidence"] < 0.70:

        result["type"] = "unverified"

        result["severity"] = 0

        result["reasoning"] = (
            "Model confidence is below 0.70; "
            "pending more reports."
        )


    # Unverified always has severity 0
    if result["type"] == "unverified":

        result["severity"] = 0


    return result

if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python AI/Classifier.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    result = classify_image(image_path)

    print("\nStructured AI Result:")
    print(
        json.dumps(
            result,
            indent=2
        )
    )
import os
import json
import mimetypes
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompt import HAZARD_DETECTION_PROMPT
from validator import validate_result


PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY was not found in .env")

client = genai.Client(api_key=api_key)


def unavailable_result(message):
    return {
        "type": "unverified",
        "severity": 0,
        "confidence": 0,
        "reasoning": message
    }


def classify_image(image_path):

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    mime_type, _ = mimetypes.guess_type(str(image_path))

    if not mime_type or not mime_type.startswith("image/"):
        raise ValueError(
            f"Unsupported image type: {image_path}"
        )

    image_bytes = image_path.read_bytes()

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "type": {
                "type": "STRING",
                "enum": [
                    "waterlogging",
                    "no_hazard",
                    "fire",
                    "road_blockage",
                    "accident",
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

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",

            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                ),
                HAZARD_DETECTION_PROMPT
            ],

            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0
            )
        )

    except Exception as e:
        print(f"Gemini API error: {e}")

        return unavailable_result(
            "AI classification is temporarily unavailable."
        )

    if not response or not response.text:
        return unavailable_result(
            "AI returned an empty response."
        )

    try:
        result = json.loads(response.text)

    except (json.JSONDecodeError, TypeError):
        return unavailable_result(
            "AI returned an invalid JSON response."
        )

    return validate_result(result)


if __name__ == "__main__":

    if len(sys.argv) != 2:
        print(
            "Usage: python AI\\Classifier.py "
            "\"AI\\test images\\image.png\""
        )
        sys.exit(1)

    image_path = sys.argv[1]

    try:

        result = classify_image(image_path)

        print("\nStructured AI Result:")

        print(
            json.dumps(
                result,
                indent=2
            )
        )

    except Exception as e:

        print(f"Error: {e}")
        sys.exit(1)
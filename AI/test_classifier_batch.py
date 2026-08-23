"""
Automated test runner for the AI hazard classifier.

Runs classify_image() on every image inside AI/test images
and prints a summary. Does not modify Classifier.py.

Usage:
    python AI/test_classifier_batch.py
"""

import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TEST_FOLDER = PROJECT_ROOT / "AI" / "test images"

sys.path.insert(0, str(Path(__file__).resolve().parent))

from Classifier import classify_image  # noqa: E402

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def run_all_tests():
    if not TEST_FOLDER.exists():
        print(f"Test folder not found: {TEST_FOLDER}")
        sys.exit(1)

    image_files = sorted(
        f for f in TEST_FOLDER.iterdir()
        if f.suffix.lower() in SUPPORTED_EXTENSIONS
    )

    if not image_files:
        print(f"No test images found in {TEST_FOLDER}")
        sys.exit(1)

    print(f"Found {len(image_files)} test image(s) in {TEST_FOLDER}\n")

    passed = 0
    failed = 0

    for image_path in image_files:
        print(f"--- Testing: {image_path.name} ---")
        try:
            result = classify_image(image_path)
            print(json.dumps(result, indent=2))

            required_keys = {"type", "severity", "confidence", "reasoning"}
            if not required_keys.issubset(result.keys()):
                missing = required_keys - result.keys()
                print(f"FAIL: missing expected keys {missing}")
                failed += 1
                continue

            if not (0 <= result["severity"] <= 4):
                print(f"FAIL: severity out of range: {result['severity']}")
                failed += 1
                continue

            if not (0 <= result["confidence"] <= 1):
                print(f"FAIL: confidence out of range: {result['confidence']}")
                failed += 1
                continue

            print("PASS")
            passed += 1

        except (FileNotFoundError, ValueError) as e:
            print(f"FAIL: {e}")
            failed += 1
        except Exception as e:
            print(f"FAIL (unexpected error): {e}")
            failed += 1

        print()

    print("=" * 40)
    print(f"Summary: {passed} passed, {failed} failed, {len(image_files)} total")
    print("=" * 40)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
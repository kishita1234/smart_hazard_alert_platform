ALLOWED_TYPES = {
    "waterlogging",
    "no_hazard",
    "fire",
    "road_blockage",
    "accident",
    "unverified"
}

MIN_CONFIDENCE = 0.70


def validate_result(result):

    # Check that result is a dictionary
    if not isinstance(result, dict):
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "Invalid AI response format."
        }

    # Required fields
    required_fields = [
        "type",
        "severity",
        "confidence",
        "reasoning"
    ]

    for field in required_fields:
        if field not in result:
            return {
                "type": "unverified",
                "severity": 0,
                "confidence": 0,
                "reasoning": f"Missing required field: {field}."
            }

    hazard_type = result["type"]
    severity = result["severity"]
    confidence = result["confidence"]
    reasoning = result["reasoning"]

    # Validate type
    if hazard_type not in ALLOWED_TYPES:
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "AI returned an invalid hazard type."
        }

    # Validate severity
    if isinstance(severity, bool) or not isinstance(severity, int):
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "Invalid severity value."
        }

    if severity < 0 or severity > 4:
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "Severity must be between 0 and 4."
        }

    # Validate confidence
    if isinstance(confidence, bool) or not isinstance(
        confidence, (int, float)
    ):
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "Invalid confidence value."
        }

    if confidence < 0 or confidence > 1:
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "Confidence must be between 0 and 1."
        }

    # Validate reasoning
    if not isinstance(reasoning, str) or not reasoning.strip():
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "Missing or invalid reasoning."
        }

    # Low confidence means unverified
    if confidence < MIN_CONFIDENCE:
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": confidence,
            "reasoning": reasoning
        }

    # No hazard must always have severity 0
    if hazard_type == "no_hazard":
        severity = 0

    # Unverified must always have severity 0
    if hazard_type == "unverified":
        severity = 0

    # Actual hazards must have severity 1-4
    if hazard_type in {
        "waterlogging",
        "fire",
        "road_blockage",
        "accident"
    }:
        if severity == 0:
            return {
                "type": "unverified",
                "severity": 0,
                "confidence": confidence,
                "reasoning": (
                    "A hazard was detected but its severity "
                    "could not be determined reliably."
                )
            }

    return {
        "type": hazard_type,
        "severity": severity,
        "confidence": confidence,
        "reasoning": reasoning.strip()
    }
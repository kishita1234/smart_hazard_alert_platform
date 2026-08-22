ALLOWED_TYPES = {
    "waterlogging",
    "fire",
    "road_damage",
    "blocked_road",
    "accident",
    "no_hazard",
    "unverified",
}

MIN_CONFIDENCE = 0.70


def validate_result(result):

    if not isinstance(result, dict):
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "Invalid AI result."
        }

    hazard_type = result.get("type")
    severity = result.get("severity")
    confidence = result.get("confidence")
    reasoning = result.get("reasoning")

    # Validate hazard type
    if hazard_type not in ALLOWED_TYPES:
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "AI returned an unsupported hazard type."
        }

    # Validate confidence
    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "AI returned an invalid confidence value."
        }

    if not 0 <= confidence <= 1:
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": 0,
            "reasoning": "AI returned an invalid confidence value."
        }

    # Low confidence means unverified
    if confidence < MIN_CONFIDENCE:
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": confidence,
            "reasoning": "AI confidence is below the required threshold."
        }

    # Validate severity
    try:
        severity = int(severity)
    except (TypeError, ValueError):
        return {
            "type": "unverified",
            "severity": 0,
            "confidence": confidence,
            "reasoning": "AI returned an invalid severity value."
        }

    # no_hazard and unverified must have severity 0
    if hazard_type in {"no_hazard", "unverified"}:
        severity = 0

    # All actual hazards must have severity 1-4
    elif hazard_type in {
        "waterlogging",
        "fire",
        "road_damage",
        "blocked_road",
        "accident",
    }:

        if severity < 1 or severity > 4:
            return {
                "type": "unverified",
                "severity": 0,
                "confidence": confidence,
                "reasoning": "AI returned an invalid hazard severity."
            }

    # Validate reasoning
    if not isinstance(reasoning, str) or not reasoning.strip():
        reasoning = "No reasoning provided."

    return {
        "type": hazard_type,
        "severity": severity,
        "confidence": confidence,
        "reasoning": reasoning.strip()
    }
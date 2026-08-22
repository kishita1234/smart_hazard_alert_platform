def validate_result(result):
    """
    Validate and normalize the structured result
    returned by the AI classifier.
    """

    required_fields = [
        "type",
        "severity",
        "confidence",
        "reasoning"
    ]

    # Check required fields
    for field in required_fields:
        if field not in result:
            raise ValueError(
                f"Missing required field: {field}"
            )

    # Check type
    allowed_types = [
        "waterlogging",
        "no_waterlogging",
        "unverified"
    ]

    if result["type"] not in allowed_types:
        raise ValueError(
            f"Invalid classification type: {result['type']}"
        )

    # Check severity
    severity = result["severity"]

    if not isinstance(severity, int):
        raise ValueError(
            "Severity must be an integer."
        )

    if severity < 0 or severity > 4:
        raise ValueError(
            "Severity must be between 0 and 4."
        )

    # Check confidence
    confidence = result["confidence"]

    if not isinstance(confidence, (int, float)):
        raise ValueError(
            "Confidence must be a number."
        )

    if confidence < 0 or confidence > 1:
        raise ValueError(
            "Confidence must be between 0 and 1."
        )

    # Rules for non-waterlogging results
    if result["type"] == "no_waterlogging":
        result["severity"] = 0

    # Rules for unverified results
    if result["type"] == "unverified":
        result["severity"] = 0

    # Low confidence → unverified
    if confidence < 0.70:
        result["type"] = "unverified"
        result["severity"] = 0

    return result
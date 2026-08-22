from validator import validate_result


def test_valid_waterlogging():
    result = {
        "type": "waterlogging",
        "severity": 3,
        "confidence": 0.95,
        "reasoning": "Standing water is visible."
    }

    validated = validate_result(result)

    assert validated["type"] == "waterlogging"
    assert validated["severity"] == 3
    assert validated["confidence"] == 0.95


def test_no_waterlogging_forces_zero_severity():
    result = {
        "type": "no_waterlogging",
        "severity": 4,
        "confidence": 0.98,
        "reasoning": "The road is dry."
    }

    validated = validate_result(result)

    assert validated["type"] == "no_waterlogging"
    assert validated["severity"] == 0


def test_low_confidence_becomes_unverified():
    result = {
        "type": "waterlogging",
        "severity": 3,
        "confidence": 0.50,
        "reasoning": "The image is unclear."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_unverified_forces_zero_severity():
    result = {
        "type": "unverified",
        "severity": 3,
        "confidence": 0.80,
        "reasoning": "More information is required."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


print("All validator tests passed.")
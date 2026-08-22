from validator import validate_result


def test_valid_waterlogging():
    result = {
        "type": "waterlogging",
        "severity": 3,
        "confidence": 0.95,
        "reasoning": "Standing water is clearly visible."
    }

    validated = validate_result(result)

    assert validated["type"] == "waterlogging"
    assert validated["severity"] == 3
    assert validated["confidence"] == 0.95


def test_no_waterlogging():
    result = {
        "type": "no_waterlogging",
        "severity": 4,
        "confidence": 0.98,
        "reasoning": "The road surface is dry."
    }

    validated = validate_result(result)

    assert validated["type"] == "no_waterlogging"
    assert validated["severity"] == 0


def test_low_confidence():
    result = {
        "type": "waterlogging",
        "severity": 3,
        "confidence": 0.50,
        "reasoning": "The image is unclear."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_valid_high_severity():
    result = {
        "type": "waterlogging",
        "severity": 4,
        "confidence": 0.90,
        "reasoning": "A large area of the road is covered with water."
    }

    validated = validate_result(result)

    assert validated["type"] == "waterlogging"
    assert validated["severity"] == 4


print("All classifier result tests passed.")
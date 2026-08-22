from validator import validate_result


def test_valid_waterlogging():

    result = {
        "type": "waterlogging",
        "severity": 3,
        "confidence": 0.95,
        "reasoning": "A large portion of the road is covered by water."
    }

    validated = validate_result(result)

    assert validated["type"] == "waterlogging"
    assert validated["severity"] == 3
    assert validated["confidence"] == 0.95


def test_no_hazard():

    result = {
        "type": "no_hazard",
        "severity": 4,
        "confidence": 0.95,
        "reasoning": "The road is dry and clearly visible."
    }

    validated = validate_result(result)

    assert validated["type"] == "no_hazard"
    assert validated["severity"] == 0


def test_fire():

    result = {
        "type": "fire",
        "severity": 3,
        "confidence": 0.91,
        "reasoning": "Visible flames are coming from a vehicle."
    }

    validated = validate_result(result)

    assert validated["type"] == "fire"
    assert validated["severity"] == 3
    assert validated["confidence"] == 0.91


def test_road_blockage():

    result = {
        "type": "road_blockage",
        "severity": 2,
        "confidence": 0.88,
        "reasoning": "Debris is blocking part of the road."
    }

    validated = validate_result(result)

    assert validated["type"] == "road_blockage"
    assert validated["severity"] == 2


def test_accident():

    result = {
        "type": "accident",
        "severity": 3,
        "confidence": 0.94,
        "reasoning": "Two vehicles are visibly involved in a collision."
    }

    validated = validate_result(result)

    assert validated["type"] == "accident"
    assert validated["severity"] == 3


def test_blurry_image():

    result = {
        "type": "unverified",
        "severity": 0,
        "confidence": 0.50,
        "reasoning": "The image is too blurry to determine the situation."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_low_confidence():

    result = {
        "type": "fire",
        "severity": 3,
        "confidence": 0.50,
        "reasoning": "Possible fire is visible."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_invalid_type():

    result = {
        "type": "earthquake",
        "severity": 3,
        "confidence": 0.90,
        "reasoning": "Invalid hazard."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_invalid_severity():

    result = {
        "type": "fire",
        "severity": 7,
        "confidence": 0.90,
        "reasoning": "Fire is visible."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_invalid_confidence():

    result = {
        "type": "accident",
        "severity": 2,
        "confidence": 1.5,
        "reasoning": "Accident is visible."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_missing_field():

    result = {
        "type": "fire",
        "severity": 2,
        "confidence": 0.90
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


def test_hazard_with_zero_severity():

    result = {
        "type": "accident",
        "severity": 0,
        "confidence": 0.90,
        "reasoning": "A collision is visible."
    }

    validated = validate_result(result)

    assert validated["type"] == "unverified"
    assert validated["severity"] == 0


print("Running all validator tests...")

test_valid_waterlogging()
test_no_hazard()
test_fire()
test_road_blockage()
test_accident()
test_blurry_image()
test_low_confidence()
test_invalid_type()
test_invalid_severity()
test_invalid_confidence()
test_missing_field()
test_hazard_with_zero_severity()

print("All validator tests passed.")
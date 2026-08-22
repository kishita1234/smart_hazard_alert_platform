from validator import validate_result


def test_valid_waterlogging():

    result = validate_result({
        "type": "waterlogging",
        "severity": 3,
        "confidence": 0.95,
        "reasoning": "Road is covered by standing water."
    })

    assert result["type"] == "waterlogging"
    assert result["severity"] == 3
    assert result["confidence"] == 0.95


def test_valid_fire():

    result = validate_result({
        "type": "fire",
        "severity": 3,
        "confidence": 0.92,
        "reasoning": "Visible flames are present."
    })

    assert result["type"] == "fire"
    assert result["severity"] == 3


def test_valid_road_damage():

    result = validate_result({
        "type": "road_damage",
        "severity": 2,
        "confidence": 0.90,
        "reasoning": "A large pothole is visible."
    })

    assert result["type"] == "road_damage"
    assert result["severity"] == 2


def test_valid_blocked_road():

    result = validate_result({
        "type": "blocked_road",
        "severity": 3,
        "confidence": 0.88,
        "reasoning": "Debris blocks the road."
    })

    assert result["type"] == "blocked_road"
    assert result["severity"] == 3


def test_valid_accident():

    result = validate_result({
        "type": "accident",
        "severity": 3,
        "confidence": 0.91,
        "reasoning": "Two damaged vehicles are visible after a collision."
    })

    assert result["type"] == "accident"
    assert result["severity"] == 3


def test_no_hazard():

    result = validate_result({
        "type": "no_hazard",
        "severity": 4,
        "confidence": 0.95,
        "reasoning": "The road is clear."
    })

    assert result["type"] == "no_hazard"
    assert result["severity"] == 0


def test_low_confidence():

    result = validate_result({
        "type": "fire",
        "severity": 3,
        "confidence": 0.50,
        "reasoning": "Possible flames are visible."
    })

    assert result["type"] == "unverified"
    assert result["severity"] == 0


def test_invalid_type():

    result = validate_result({
        "type": "earthquake",
        "severity": 3,
        "confidence": 0.90,
        "reasoning": "Something is happening."
    })

    assert result["type"] == "unverified"


def test_invalid_confidence():

    result = validate_result({
        "type": "fire",
        "severity": 3,
        "confidence": 1.5,
        "reasoning": "Flames are visible."
    })

    assert result["type"] == "unverified"


def test_invalid_severity():

    result = validate_result({
        "type": "fire",
        "severity": 7,
        "confidence": 0.90,
        "reasoning": "Large fire is visible."
    })

    assert result["type"] == "unverified"


print("All validator tests passed.")
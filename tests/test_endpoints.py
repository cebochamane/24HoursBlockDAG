from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_metrics():
    r = client.get("/metrics")
    assert r.status_code == 200
    assert "python_info" in r.text or "process_start_time_seconds" in r.text


def test_predict():
    payload = {
        "user_address": "0x74232704659A37D66D6a334eF3E087eF6c139414",
        "prediction_value": 2600,
    }
    r = client.post("/api/v1/predict", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    for key in [
        "user_prediction",
        "ai_prediction",
        "ai_reasoning",
        "transaction_hash",
        "market_data",
        "timestamp",
    ]:
        assert key in data
    assert isinstance(data["ai_prediction"], float)


def test_leaderboard():
    r = client.get("/api/v1/leaderboard")
    assert r.status_code == 200
    data = r.json()
    assert "entries" in data
    assert "total_players" in data
    assert isinstance(data["entries"], list)
    if data["entries"]:
        row = data["entries"][0]
        assert set(["rank", "user_address", "accuracy_score", "total_predictions", "avg_error"]).issubset(row.keys())

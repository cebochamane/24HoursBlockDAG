from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "AI-vs-Human" in r.json()["message"]

def test_price():
    r = client.get("/api/v1/price")
    assert r.status_code == 200
    assert r.json()["asset"] == "ETH"

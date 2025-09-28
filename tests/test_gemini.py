import asyncio
from types import SimpleNamespace

from app.services import gemini_service
from app.services.gemini_service import GeminiService


def test_gemini_fallback_reasoning_when_no_key():
    # Ensure no key so service uses fallback path
    gemini_service.settings.gemini_api_key = ""
    svc = GeminiService()
    market = {"current_price": 2000.0, "price_change_24h": -1.23}
    out = asyncio.run(svc.analyze_market_sentiment(market, 2100.0))
    assert isinstance(out, str)
    assert len(out.strip()) > 0


def test_gemini_success_path_with_mock(monkeypatch):
    # Pretend we have a key
    gemini_service.settings.gemini_api_key = "test-key"

    # Mock GenerativeModel to avoid real API calls
    class DummyModel:
        def generate_content(self, prompt: str):
            return SimpleNamespace(text="LLM says: mock reasoning")

    class DummyGenAI:
        @staticmethod
        def configure(api_key: str):
            # no-op
            return None

        class GenerativeModel:
            def __new__(cls, model_name: str):
                return DummyModel()

    monkeypatch.setattr(gemini_service, "genai", DummyGenAI, raising=False)

    svc = GeminiService()
    market = {"current_price": 2000.0, "price_change_24h": 0.5}
    out = asyncio.run(svc.analyze_market_sentiment(market, 2050.0))
    assert out.startswith("LLM says:")

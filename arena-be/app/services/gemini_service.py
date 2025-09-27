import google.generativeai as genai
from config import get_settings
from app.utils.logger import logger
import random

settings = get_settings()

class GeminiService:
    def __init__(self):
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(settings.gemini_model)
            logger.info("Gemini LLM connected")
        else:
            self.model = None
            logger.warning("Gemini key missing – running in demo mode")

    async def analyze_market_sentiment(self, market: dict, ml_pred: float) -> str:
        prompt = f"""
ETH current: ${market['current_price']:.2f} (24h Δ {market['price_change_24h']:+.2f}%)
ML 7-day forecast: ${ml_pred:.2f}

Give 2-3 concise sentences of professional market reasoning for this forecast.
"""
        if self.model:
            try:
                return self.model.generate_content(prompt).text.strip()
            except Exception as e:
                logger.error(f"Gemini error: {e}")
        return self._fallback_reasoning(market, ml_pred)

    def _fallback_reasoning(self, market: dict, ml_pred: float) -> str:
        reasons = [
            "Market shows consolidation with low volatility.",
            "On-chain metrics suggest steady accumulation.",
            "Technical indicators lean neutral-to-bullish.",
            "Macro headwinds likely priced in.",
        ]
        return " ".join(random.sample(reasons, 2))

gemini = GeminiService()

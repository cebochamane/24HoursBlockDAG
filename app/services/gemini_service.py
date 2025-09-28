import google.generativeai as genai
import os
from config import get_settings
from app.utils.logger import logger
import random

settings = get_settings()

class GeminiService:
    def __init__(self):
        api_key = settings.gemini_api_key or os.getenv("GOOGLE_API_KEY", "")
        self.model = None
        if api_key:
            genai.configure(api_key=api_key)
            preferred = [
                getattr(settings, "gemini_model", ""),
                # add common 1.5 variants
                "gemini-1.5-flash-8b",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro-latest",
            ]
            tried = set()
            # 1) Try preferred explicit names
            for name in preferred:
                if not name or name in tried:
                    continue
                tried.add(name)
                try:
                    m = genai.GenerativeModel(name)
                    m.generate_content("ping")
                    self.model = m
                    logger.info(f"Gemini LLM connected (model={name})")
                    break
                except Exception as e:
                    logger.warning(f"Gemini model test failed for '{name}': {e}")
            # 2) If still not set, discover models from API and pick one that supports generateContent
            if self.model is None:
                try:
                    avail = list(genai.list_models())
                    # Filter to those that support generateContent
                    usable = [m for m in avail if hasattr(m, 'supported_generation_methods') and 'generateContent' in (m.supported_generation_methods or [])]
                    # Score models preferring 1.5 then flash/pro
                    def score(m):
                        n = getattr(m, 'name', '')
                        s = 0
                        s += 4 if '1.5' in n else 0
                        s += 2 if 'flash' in n else 0
                        s += 1 if 'pro' in n else 0
                        return -s  # lower is better when sorting
                    usable.sort(key=score)
                    for mdl in usable:
                        name = getattr(mdl, 'name', None)
                        if not name or name in tried:
                            continue
                        try:
                            gm = genai.GenerativeModel(name)
                            gm.generate_content("ping")
                            self.model = gm
                            logger.info(f"Gemini LLM connected (model={name}) [auto-discovered]")
                            break
                        except Exception as e:
                            logger.warning(f"Gemini auto-discovered model failed '{name}': {e}")
                except Exception as e:
                    logger.warning(f"Gemini list_models failed: {e}")
            if self.model is None:
                logger.error("Gemini initialization failed; running in demo mode")
        else:
            logger.warning("Gemini key missing – running in demo mode")
    
    @property
    def is_connected(self) -> bool:
        return self.model is not None

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

    async def chat(self, prompt: str) -> str:
        """Generic chat endpoint: returns a concise response to the user's prompt.
        Falls back to a deterministic message when no API key/config is present or on error.
        """
        if self.model:
            try:
                resp = self.model.generate_content(prompt)
                # Prefer the simple .text property when present
                txt = getattr(resp, "text", None)
                if isinstance(txt, str) and txt.strip():
                    return txt.strip()
                # Otherwise, try to extract from candidates/parts
                cand = getattr(resp, "candidates", None)
                if isinstance(cand, (list, tuple)) and cand:
                    parts = getattr(cand[0], "content", None)
                    parts = getattr(parts, "parts", None)
                    if isinstance(parts, (list, tuple)):
                        chunks = []
                        for p in parts:
                            t = getattr(p, "text", None)
                            if isinstance(t, str) and t.strip():
                                chunks.append(t.strip())
                        if chunks:
                            return "\n".join(chunks)
                logger.warning("Gemini chat: empty response structure; returning fallback")
            except Exception as e:
                logger.error(f"Gemini chat error: {e}")
        # Fallback demo response
        return "I'm running in demo mode without an LLM key. For now, here's a concise tip: manage risk, size your positions conservatively, and avoid overtrading."

    def _fallback_reasoning(self, market: dict, ml_pred: float) -> str:
        reasons = [
            "Market shows consolidation with low volatility.",
            "On-chain metrics suggest steady accumulation.",
            "Technical indicators lean neutral-to-bullish.",
            "Macro headwinds likely priced in.",
        ]
        return " ".join(random.sample(reasons, 2))

gemini = GeminiService()

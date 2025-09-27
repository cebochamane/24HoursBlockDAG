import aiohttp, random, time
from datetime import datetime
from app.utils.cache import cache
from app.utils.logger import logger

CACHE_TTL = 30

class PriceService:
    @cache(CACHE_TTL)
    async def get_eth_price(self) -> dict:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true"
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as s:
                async with s.get(url) as r:
                    r.raise_for_status()
                    data = (await r.json())["ethereum"]
                    return {
                        "asset": "ETH",
                        "current_price": data["usd"],
                        "price_change_24h": data["usd_24h_change"],
                        "market_cap": data["usd_market_cap"],
                        "timestamp": datetime.utcnow(),
                    }
        except Exception as e:
            logger.warning(f"Coingecko fail: {e} – simulating")
            return self._simulate()

    def _simulate(self) -> dict:
        base = 2500
        noise = random.uniform(-100, 100)
        return {
            "asset": "ETH",
            "current_price": round(base + noise, 2),
            "price_change_24h": round(random.uniform(-5, 5), 2),
            "market_cap": round((base + noise) * 120_000_000, 0),
            "timestamp": datetime.utcnow(),
        }

price = PriceService()

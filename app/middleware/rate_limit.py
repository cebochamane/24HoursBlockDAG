import time
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from config import get_settings

settings = get_settings()

# Simple per-IP sliding window limiter stored in-memory
# key -> (window_start_epoch, count)
_store: Dict[str, Tuple[float, int]] = {}
WINDOW_SEC = 60

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = int(now // WINDOW_SEC)
        key = f"{client_ip}:{window}"

        # rotate previous window cleanup (best-effort)
        prev_key = f"{client_ip}:{window-1}"
        _store.pop(prev_key, None)

        count = _store.get(key, (now, 0))[1] + 1
        _store[key] = (now, count)

        limit = max(1, settings.rate_limit_rpm)
        if count > limit:
            retry_after = WINDOW_SEC - int(now % WINDOW_SEC)
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded", "retry_after": retry_after},
                headers={"Retry-After": str(retry_after)},
            )

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - count))
        return response

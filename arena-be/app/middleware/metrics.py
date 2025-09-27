import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from prometheus_client import Counter, Histogram

REQUEST_COUNTER = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path", "status"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
)


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response: Response = await call_next(request)
        elapsed = time.perf_counter() - start

        method = request.method
        # limit path cardinality by using route.path if available
        try:
            path = request.scope.get("route").path  # type: ignore[assignment]
        except Exception:
            path = request.url.path
        status = str(response.status_code)

        REQUEST_COUNTER.labels(method=method, path=path, status=status).inc()
        REQUEST_DURATION.labels(method=method, path=path, status=status).observe(elapsed)
        return response

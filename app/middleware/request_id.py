import uuid
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import contextvars

# Context variable to store request id per request context
request_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)


class RequestIdMiddleware(BaseHTTPMiddleware):
    HEADER_NAME = "X-Request-ID"

    async def dispatch(self, request: Request, call_next):
        incoming = request.headers.get(self.HEADER_NAME)
        rid = incoming or str(uuid.uuid4())
        token = request_id_ctx.set(rid)
        try:
            response: Response = await call_next(request)
        finally:
            request_id_ctx.reset(token)
        response.headers[self.HEADER_NAME] = rid
        return response

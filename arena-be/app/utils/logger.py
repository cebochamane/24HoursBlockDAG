import logging
from pythonjsonlogger import jsonlogger
from app.middleware.request_id import request_id_ctx

logger = logging.getLogger("prediction-league")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    fmt=(
        "%(asctime)s %(levelname)s %(name)s %(message)s "
        "%(filename)s %(lineno)d %(funcName)s %(request_id)s"
    )
)
handler.setFormatter(formatter)
logger.handlers = [handler]

class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            rid = request_id_ctx.get()
        except Exception:
            rid = None
        setattr(record, "request_id", rid)
        return True

logger.addFilter(RequestIdFilter())

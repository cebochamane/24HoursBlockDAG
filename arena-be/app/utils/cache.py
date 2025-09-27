import time, functools
from typing import Callable

class TimedCache:
    def __init__(self):
        self._store = {}
    def get(self, key: str):
        if key in self._store:
            value, expiry = self._store[key]
            if time.time() < expiry:
                return value
            del self._store[key]
        return None
    def set(self, key: str, value, ttl: int):
        self._store[key] = (value, time.time() + ttl)

_cache = TimedCache()

def cache(ttl: int):
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            key = str((func.__name__, args, kwargs))
            hit = _cache.get(key)
            if hit is not None:
                return hit
            result = await func(*args, **kwargs)
            _cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator

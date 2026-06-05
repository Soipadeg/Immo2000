"""Redis caching utilities for Immo2000"""

import redis
import json
from functools import wraps
from flask import request

# Initialize Redis
try:
    redis_client = redis.Redis(
        host='redis',
        port=6379,
        db=0,
        decode_responses=True
    )
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis cache available")
except Exception as e:
    print(f"⚠️  Redis unavailable: {e}")
    redis_client = None
    REDIS_AVAILABLE = False

def redis_cache(cache_type='listings', ttl=3600):
    """
    Decorator for caching GET endpoint responses.

    Args:
        cache_type: Cache category (listings, messages, etc.)
        ttl: Time to live in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not REDIS_AVAILABLE:
                return f(*args, **kwargs)

            # Build cache key
            query_string = '&'.join(sorted(
                [f"{k}={v}" for k, v in request.args.items()]
            ))
            cache_key = f"cache:{cache_type}:{request.path}"
            if query_string:
                cache_key += f":{query_string}"

            # Try to get from cache
            try:
                cached = redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception:
                pass

            # Execute function
            result = f(*args, **kwargs)

            # Store in cache
            try:
                redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
            except Exception:
                pass

            return result
        return decorated_function
    return decorator

def clear_cache(pattern):
    """
    Clear cache entries matching pattern.

    Args:
        pattern: Pattern to match (e.g., 'cache:listings:*')
    """
    if not REDIS_AVAILABLE:
        return

    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass

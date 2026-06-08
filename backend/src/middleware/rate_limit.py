"""
FastAPI Rate Limiting Middleware - Phase 3

Implémentation de rate limiting par IP avec Redis
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Rate limiting configuration"""

    # Default limits
    DEFAULT_LIMIT = "100/minute"
    AUTH_LIMIT = "5/minute"
    SEARCH_LIMIT = "30/minute"
    UPLOAD_LIMIT = "10/minute"

    # Whitelist IPs
    WHITELIST_IPS = []

    @classmethod
    def is_whitelisted(cls, ip: str) -> bool:
        """Check if IP is whitelisted"""
        return ip in cls.WHITELIST_IPS


def create_limiter() -> Limiter:
    """Create rate limiter instance"""

    def rate_limit_key_func(request: Request):
        """Get rate limit key (IP address)"""
        # Check if IP is whitelisted
        ip = get_remote_address(request)
        if RateLimitConfig.is_whitelisted(ip):
            return f"unlimited-{ip}"

        return ip

    limiter = Limiter(key_func=rate_limit_key_func)
    return limiter


# Global rate limiter
rate_limiter = create_limiter()


async def rate_limit_error_handler(request: Request, exc: RateLimitExceeded):
    """Custom rate limit error handler"""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please try again later.",
            "retry_after": exc.detail
        }
    )


class RateLimitMiddleware:
    """Custom rate limiting middleware with Redis backend"""

    def __init__(self, app, redis_client=None):
        self.app = app
        self.redis = redis_client
        self.limits = {
            "/api/v1/auth/login": RateLimitConfig.AUTH_LIMIT,
            "/api/v1/auth/register": RateLimitConfig.AUTH_LIMIT,
            "/api/v1/auth/password-reset": RateLimitConfig.AUTH_LIMIT,
            "/api/v1/search": RateLimitConfig.SEARCH_LIMIT,
            "/api/v1/listings/create": RateLimitConfig.UPLOAD_LIMIT,
        }

    async def __call__(self, request: Request, call_next):
        """Apply rate limiting to request"""

        # Skip rate limiting for certain paths
        if request.url.path.startswith("/api/docs") or request.url.path.startswith("/api/redoc"):
            return await call_next(request)

        # Get client IP
        ip = request.client.host if request.client else "unknown"

        # Check if whitelisted
        if RateLimitConfig.is_whitelisted(ip):
            return await call_next(request)

        # Check Redis-based rate limit if available
        if self.redis:
            try:
                key = f"rate_limit:{ip}:{request.url.path}"
                current = await self.redis.incr(key)

                if current == 1:
                    # Set expiry on first request
                    await self.redis.expire(key, 60)

                # Get limit for this endpoint
                limit = self._get_limit_for_endpoint(request.url.path)
                limit_count = int(limit.split("/")[0])

                if current > limit_count:
                    logger.warning(f"⚠️  Rate limit exceeded for IP {ip} on {request.url.path}")
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": "Too many requests. Please try again later.",
                            "limit": limit,
                            "current": current
                        }
                    )

                # Add rate limit headers
                request.state.rate_limit_remaining = limit_count - current
                request.state.rate_limit_reset = 60

            except Exception as e:
                logger.error(f"❌ Rate limiting error: {e}")
                # Continue without rate limiting if Redis fails

        response = await call_next(request)

        # Add rate limit headers to response
        if hasattr(request.state, 'rate_limit_remaining'):
            response.headers["X-RateLimit-Limit"] = str(self._get_limit_count(request.url.path))
            response.headers["X-RateLimit-Remaining"] = str(request.state.rate_limit_remaining)
            response.headers["X-RateLimit-Reset"] = str(request.state.rate_limit_reset)

        return response

    def _get_limit_for_endpoint(self, path: str) -> str:
        """Get rate limit for endpoint"""
        for endpoint_pattern, limit in self.limits.items():
            if path.startswith(endpoint_pattern):
                return limit
        return RateLimitConfig.DEFAULT_LIMIT

    def _get_limit_count(self, path: str) -> int:
        """Get limit count for endpoint"""
        limit = self._get_limit_for_endpoint(path)
        return int(limit.split("/")[0])


class AdaptiveRateLimiter:
    """Adaptive rate limiting based on load"""

    def __init__(self, base_limit: int = 100):
        self.base_limit = base_limit
        self.current_load = 0
        self.threshold = 80  # Percentage

    def get_dynamic_limit(self) -> int:
        """Get limit based on current system load"""
        # In production, this would check actual system metrics
        if self.current_load > self.threshold:
            return int(self.base_limit * 0.5)  # Reduce by 50%
        return self.base_limit

    def update_load(self, cpu_percent: float, memory_percent: float):
        """Update current system load"""
        self.current_load = max(cpu_percent, memory_percent)

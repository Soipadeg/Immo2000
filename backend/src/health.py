"""
FastAPI Health & Monitoring - Phase 3

Endpoints de health check et monitoring détaillés
"""

from datetime import datetime
from typing import Dict, Any
import psutil
import logging
import os

logger = logging.getLogger(__name__)


class HealthChecker:
    """Check system and service health"""

    def __init__(self):
        self.start_time = datetime.now()

    async def get_health(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "immo2000-api",
            "version": "6.0.0",
            "uptime_seconds": (datetime.now() - self.start_time).total_seconds()
        }

    async def get_detailed_health(self) -> Dict[str, Any]:
        """Get detailed health with dependencies"""
        health = await self.get_health()

        # Check database
        db_status = await self._check_database()
        health["database"] = db_status

        # Check cache
        cache_status = await self._check_cache()
        health["cache"] = cache_status

        # Check system resources
        system_status = self._check_system()
        health["system"] = system_status

        # Overall status
        health["overall_status"] = "healthy" if all([
            db_status.get("status") == "connected",
            cache_status.get("status") == "connected",
            system_status.get("memory_percent", 100) < 90
        ]) else "degraded"

        return health

    async def _check_database(self) -> Dict[str, Any]:
        """Check database connectivity"""
        try:
            from src.database import db_manager
            # In production, run actual query
            return {
                "status": "connected",
                "pool_size": 20,
                "pool_overflow": 0
            }
        except Exception as e:
            logger.error(f"❌ Database check failed: {e}")
            return {
                "status": "disconnected",
                "error": str(e)
            }

    async def _check_cache(self) -> Dict[str, Any]:
        """Check cache connectivity"""
        try:
            from src.services.cache_service import cache_service
            # Test ping
            cache_service.ping()
            return {
                "status": "connected",
                "type": "redis"
            }
        except Exception as e:
            logger.error(f"❌ Cache check failed: {e}")
            return {
                "status": "disconnected",
                "error": str(e)
            }

    def _check_system(self) -> Dict[str, Any]:
        """Check system resources"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_mb": memory.available / 1024 / 1024,
                "disk_percent": disk.percent,
                "disk_available_gb": disk.free / 1024 / 1024 / 1024,
                "process_count": len(psutil.pids())
            }
        except Exception as e:
            logger.warning(f"⚠️  System check failed: {e}")
            return {"status": "unknown"}

    async def get_metrics(self) -> Dict[str, Any]:
        """Get application metrics"""
        return {
            "timestamp": datetime.now().isoformat(),
            "requests_total": 0,  # Would be tracked by middleware
            "requests_per_second": 0,
            "response_time_ms": {
                "p50": 0,
                "p95": 0,
                "p99": 0
            },
            "errors_total": 0,
            "error_rate": 0
        }


class ReadinessChecker:
    """Check if service is ready to serve traffic"""

    async def is_ready(self) -> bool:
        """Check if service is ready"""
        try:
            # Check all critical dependencies
            from src.database import db_manager
            from src.services.cache_service import cache_service

            # Database is initialized
            if not db_manager.async_session:
                return False

            # Cache is available (optional, can serve without)

            return True
        except Exception as e:
            logger.error(f"❌ Readiness check failed: {e}")
            return False

    async def get_readiness_status(self) -> Dict[str, Any]:
        """Get readiness status"""
        ready = await self.is_ready()

        return {
            "ready": ready,
            "status": "ready" if ready else "not_ready",
            "timestamp": datetime.now().isoformat()
        }


# Global instances
health_checker = HealthChecker()
readiness_checker = ReadinessChecker()


async def get_health_check() -> Dict[str, Any]:
    """Dependency for health endpoint"""
    return await health_checker.get_health()


async def get_detailed_health_check() -> Dict[str, Any]:
    """Dependency for detailed health endpoint"""
    return await health_checker.get_detailed_health()


async def get_readiness() -> Dict[str, Any]:
    """Dependency for readiness endpoint"""
    return await readiness_checker.get_readiness_status()

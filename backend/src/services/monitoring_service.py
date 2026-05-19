# backend/src/services/monitoring_service.py

import os
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from collections import defaultdict, deque
import psutil
from redis import Redis
import json

class MonitoringService:
    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis = redis_client
        self.error_buffer = deque(maxlen=1000)  # Keep last 1000 errors
        self.request_times = defaultdict(list)
        self.start_time = time.time()

    # Error tracking
    def record_error(self, error_type: str, error_message: str, context: Optional[Dict] = None):
        """Record error occurrence"""
        error_entry = {
            'type': error_type,
            'message': error_message,
            'context': context or {},
            'timestamp': datetime.now().isoformat(),
        }
        self.error_buffer.append(error_entry)

        if self.redis:
            # Increment error counter
            self.redis.incr(f'error:{error_type}')
            # Add to error stream for ELK Stack
            self.redis.lpush(f'errors:stream', json.dumps(error_entry))
            self.redis.ltrim(f'errors:stream', 0, 999)

    def get_error_rate(self, minutes: int = 5) -> float:
        """Get error rate for last N minutes"""
        if not self.redis:
            return 0.0

        # Count errors in time window
        error_count = 0
        for error in self.error_buffer:
            error_time = datetime.fromisoformat(error['timestamp'])
            if datetime.now() - error_time < timedelta(minutes=minutes):
                error_count += 1

        # Get request count
        request_count = len([e for e in self.error_buffer])

        if request_count == 0:
            return 0.0

        return (error_count / request_count) * 100

    def get_error_summary(self) -> Dict:
        """Get summary of errors"""
        error_types = defaultdict(int)
        for error in self.error_buffer:
            error_types[error['type']] += 1

        return {
            'total_errors': len(self.error_buffer),
            'error_types': dict(error_types),
            'latest_errors': list(self.error_buffer)[-10:],
        }

    # Request timing
    def record_request_time(self, endpoint: str, method: str, duration: float):
        """Record request timing"""
        key = f'{method}:{endpoint}'
        self.request_times[key].append(duration)

        # Keep only last 1000 requests
        if len(self.request_times[key]) > 1000:
            self.request_times[key].pop(0)

        if self.redis:
            # Store metrics for analysis
            self.redis.lpush(f'request_times:{key}', duration)
            self.redis.ltrim(f'request_times:{key}', 0, 999)

    def get_endpoint_stats(self, endpoint: str, method: str) -> Dict:
        """Get statistics for an endpoint"""
        key = f'{method}:{endpoint}'
        times = self.request_times.get(key, [])

        if not times:
            return {
                'endpoint': endpoint,
                'method': method,
                'count': 0,
                'avg_time': 0,
                'min_time': 0,
                'max_time': 0,
                'p95_time': 0,
            }

        sorted_times = sorted(times)
        p95_index = int(len(sorted_times) * 0.95)

        return {
            'endpoint': endpoint,
            'method': method,
            'count': len(times),
            'avg_time': sum(times) / len(times),
            'min_time': min(times),
            'max_time': max(times),
            'p95_time': sorted_times[p95_index] if p95_index < len(sorted_times) else 0,
        }

    def get_all_endpoint_stats(self) -> List[Dict]:
        """Get statistics for all endpoints"""
        stats = []
        for key in self.request_times:
            method, endpoint = key.split(':', 1)
            stats.append(self.get_endpoint_stats(endpoint, method))
        return stats

    # System metrics
    def get_system_metrics(self) -> Dict:
        """Get system resource metrics"""
        process = psutil.Process()

        return {
            'memory_percent': process.memory_percent(),
            'cpu_percent': process.cpu_percent(interval=0.1),
            'num_threads': process.num_threads(),
            'disk_usage_percent': psutil.disk_usage('/').percent,
            'uptime': time.time() - self.start_time,
        }

    def get_memory_info(self) -> Dict:
        """Get detailed memory information"""
        vm = psutil.virtual_memory()

        return {
            'total_mb': vm.total / 1024 / 1024,
            'available_mb': vm.available / 1024 / 1024,
            'used_mb': vm.used / 1024 / 1024,
            'percent': vm.percent,
        }

    def get_disk_info(self) -> Dict:
        """Get disk usage information"""
        disk = psutil.disk_usage('/')

        return {
            'total_gb': disk.total / 1024 / 1024 / 1024,
            'free_gb': disk.free / 1024 / 1024 / 1024,
            'used_gb': disk.used / 1024 / 1024 / 1024,
            'percent': disk.percent,
        }

    # Database metrics
    def record_db_query(self, query_type: str, duration: float, table: Optional[str] = None):
        """Record database query"""
        if self.redis:
            self.redis.lpush(f'db_queries:{query_type}', duration)
            if table:
                self.redis.lpush(f'db_queries:table:{table}', duration)

    def get_db_query_stats(self, query_type: str) -> Dict:
        """Get database query statistics"""
        if not self.redis:
            return {}

        durations = self.redis.lrange(f'db_queries:{query_type}', 0, -1)
        if not durations:
            return {'query_type': query_type, 'count': 0}

        durations = [float(d) for d in durations]
        sorted_durations = sorted(durations)
        p95_index = int(len(sorted_durations) * 0.95)

        return {
            'query_type': query_type,
            'count': len(durations),
            'avg_time': sum(durations) / len(durations),
            'min_time': min(durations),
            'max_time': max(durations),
            'p95_time': sorted_durations[p95_index],
        }

    # Cache metrics
    def record_cache_hit(self, cache_type: str):
        """Record cache hit"""
        if self.redis:
            self.redis.incr(f'cache_hits:{cache_type}')

    def record_cache_miss(self, cache_type: str):
        """Record cache miss"""
        if self.redis:
            self.redis.incr(f'cache_misses:{cache_type}')

    def get_cache_stats(self, cache_type: str) -> Dict:
        """Get cache statistics"""
        if not self.redis:
            return {}

        hits = int(self.redis.get(f'cache_hits:{cache_type}') or 0)
        misses = int(self.redis.get(f'cache_misses:{cache_type}') or 0)
        total = hits + misses
        hit_rate = (hits / total * 100) if total > 0 else 0

        return {
            'cache_type': cache_type,
            'hits': hits,
            'misses': misses,
            'total': total,
            'hit_rate': hit_rate,
        }

# Global instance
_monitoring_service = None

def get_monitoring_service() -> MonitoringService:
    global _monitoring_service
    if _monitoring_service is None:
        redis_client = Redis.from_url(
            os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        )
        _monitoring_service = MonitoringService(redis_client)
    return _monitoring_service

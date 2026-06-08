"""
Performance Tracking Middleware

Tracks API response times, database queries, cache hits/misses, and error rates
for real-time monitoring and analytics.
"""

import time
import json
from datetime import datetime
from functools import wraps
from typing import Dict, List, Any

from flask import request, g
from sqlalchemy import event, text

# Performance metrics storage (in production, use Redis or TimescaleDB)
performance_metrics: Dict[str, Any] = {
    'requests': [],
    'queries': [],
    'cache_stats': {'hits': 0, 'misses': 0, 'total': 0},
    'errors': []
}

MAX_METRICS_STORAGE = 1000  # Keep last 1000 metrics


class PerformanceTracker:
    """Tracks and aggregates performance metrics"""

    @staticmethod
    def start_request():
        """Initialize request tracking"""
        g.request_start = time.time()
        g.db_queries = []
        g.cache_operations = []

    @staticmethod
    def end_request(response):
        """Finalize request tracking and record metrics"""
        if not hasattr(g, 'request_start'):
            return response

        elapsed = (time.time() - g.request_start) * 1000  # Convert to ms

        metric = {
            'timestamp': datetime.utcnow().isoformat(),
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(elapsed, 2),
            'db_queries': len(g.db_queries),
            'cache_hits': sum(1 for op in g.cache_operations if op['type'] == 'hit'),
            'cache_misses': sum(1 for op in g.cache_operations if op['type'] == 'miss'),
        }

        # Add error info if present
        if response.status_code >= 400:
            metric['error_type'] = 'client_error' if response.status_code < 500 else 'server_error'

        # Store metric (keep recent ones)
        performance_metrics['requests'].append(metric)
        if len(performance_metrics['requests']) > MAX_METRICS_STORAGE:
            performance_metrics['requests'].pop(0)

        # Update cache stats
        performance_metrics['cache_stats']['hits'] += metric['cache_hits']
        performance_metrics['cache_stats']['misses'] += metric['cache_misses']
        performance_metrics['cache_stats']['total'] = (
            performance_metrics['cache_stats']['hits'] +
            performance_metrics['cache_stats']['misses']
        )

        return response


def track_database_queries(dbsession):
    """Setup database query tracking with SQLAlchemy"""

    @event.listens_for(dbsession, 'before_cursor_execute')
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Track query start time"""
        conn.info.setdefault('query_start_time', []).append(time.time())

    @event.listens_for(dbsession, 'after_cursor_execute')
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Track query execution time"""
        if not hasattr(g, 'db_queries'):
            g.db_queries = []

        total = time.time() - conn.info['query_start_time'].pop(-1)

        # Extract table name from query
        table = 'unknown'
        if 'FROM' in statement.upper():
            try:
                from_index = statement.upper().index('FROM')
                table = statement[from_index + 4:].split()[0].strip('"')
            except:
                pass

        g.db_queries.append({
            'table': table,
            'statement': statement[:100],  # First 100 chars
            'duration_ms': round(total * 1000, 2),
        })


def track_cache_operation(operation_type: str, key: str, hit: bool = None):
    """Track cache operations (hit/miss)"""
    if not hasattr(g, 'cache_operations'):
        g.cache_operations = []

    op_type = 'hit' if hit else 'miss' if hit is False else operation_type

    g.cache_operations.append({
        'type': op_type,
        'key': key,
        'timestamp': datetime.utcnow().isoformat(),
    })


def performance_route(func):
    """Decorator to track performance for specific routes"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        PerformanceTracker.start_request()
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            # Log error
            performance_metrics['errors'].append({
                'timestamp': datetime.utcnow().isoformat(),
                'path': request.path,
                'error': str(e)[:100],
            })
            raise
    return wrapper


class AnalyticsEvent:
    """Track custom analytics events"""

    @staticmethod
    def track_event(event_name: str, properties: Dict[str, Any] = None):
        """Track a custom event"""
        event_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'event': event_name,
            'properties': properties or {},
        }
        # In production, send to Sentry, PostHog, or Datadog
        return event_data


def get_performance_stats() -> Dict[str, Any]:
    """Get current performance statistics"""
    requests = performance_metrics.get('requests', [])

    if not requests:
        return {
            'avg_response_time_ms': 0,
            'p95_response_time_ms': 0,
            'p99_response_time_ms': 0,
            'error_rate': 0,
            'cache_hit_rate': 0,
            'total_requests': 0,
        }

    # Calculate response time percentiles
    durations = sorted([r['duration_ms'] for r in requests])
    total_requests = len(durations)

    def percentile(data, p):
        index = int(len(data) * (p / 100))
        return data[index] if index < len(data) else data[-1]

    # Calculate error rate
    errors = sum(1 for r in requests if r['status_code'] >= 400)
    error_rate = (errors / total_requests * 100) if total_requests > 0 else 0

    # Calculate cache stats
    cache_stats = performance_metrics['cache_stats']
    total_cache_ops = cache_stats['total']
    cache_hit_rate = (
        (cache_stats['hits'] / total_cache_ops * 100)
        if total_cache_ops > 0 else 0
    )

    return {
        'avg_response_time_ms': round(sum(durations) / len(durations), 2),
        'p95_response_time_ms': round(percentile(durations, 95), 2),
        'p99_response_time_ms': round(percentile(durations, 99), 2),
        'error_rate': round(error_rate, 2),
        'cache_hit_rate': round(cache_hit_rate, 2),
        'total_requests': total_requests,
        'recent_requests': requests[-10:],  # Last 10 requests
    }


def get_database_stats() -> Dict[str, Any]:
    """Get database performance statistics"""
    queries = performance_metrics.get('queries', [])

    if not queries:
        return {
            'avg_query_time_ms': 0,
            'p95_query_time_ms': 0,
            'total_queries': 0,
            'slowest_queries': [],
        }

    durations = [q['duration_ms'] for q in queries]

    def percentile(data, p):
        data_sorted = sorted(data)
        index = int(len(data_sorted) * (p / 100))
        return data_sorted[index] if index < len(data_sorted) else data_sorted[-1]

    slowest = sorted(queries, key=lambda x: x['duration_ms'], reverse=True)[:5]

    return {
        'avg_query_time_ms': round(sum(durations) / len(durations), 2),
        'p95_query_time_ms': round(percentile(durations, 95), 2),
        'total_queries': len(queries),
        'slowest_queries': [
            {
                'table': q['table'],
                'duration_ms': q['duration_ms'],
                'statement': q['statement'],
            }
            for q in slowest
        ],
    }


# Web Vitals collection endpoint data
web_vitals_data: List[Dict[str, Any]] = []


def collect_web_vital(vital_name: str, value: float, page_url: str = None):
    """Collect Web Vitals from frontend"""
    vital = {
        'timestamp': datetime.utcnow().isoformat(),
        'name': vital_name,
        'value': value,
        'url': page_url,
    }
    web_vitals_data.append(vital)

    # Keep last 100 vitals
    if len(web_vitals_data) > 100:
        web_vitals_data.pop(0)

    return vital


def get_web_vitals_stats() -> Dict[str, Any]:
    """Get Web Vitals statistics"""
    if not web_vitals_data:
        return {
            'fcp_avg': 0,
            'lcp_avg': 0,
            'cls_avg': 0,
            'ttfb_avg': 0,
            'total_vitals': 0,
        }

    vitals_by_type = {}
    for vital in web_vitals_data:
        name = vital['name']
        if name not in vitals_by_type:
            vitals_by_type[name] = []
        vitals_by_type[name].append(vital['value'])

    result = {'total_vitals': len(web_vitals_data)}
    for name, values in vitals_by_type.items():
        avg = sum(values) / len(values)
        result[f'{name.lower()}_avg'] = round(avg, 2)

    return result

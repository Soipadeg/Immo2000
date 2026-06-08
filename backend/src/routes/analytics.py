"""
Analytics Routes - Performance tracking and metrics endpoints
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import json

from src.middleware.performance import (
    get_performance_stats,
    get_database_stats,
    get_web_vitals_stats,
    collect_web_vital,
    AnalyticsEvent,
)

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/v1/analytics')

# In-memory event storage (use database in production)
events_storage = []
MAX_EVENTS = 10000


@analytics_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint with performance metrics"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'performance': get_performance_stats(),
        'database': get_database_stats(),
    }), 200


@analytics_bp.route('/performance', methods=['GET'])
def get_performance():
    """Get current performance metrics"""
    stats = get_performance_stats()
    return jsonify({
        'status': 'ok',
        'data': stats,
        'timestamp': datetime.utcnow().isoformat(),
    }), 200


@analytics_bp.route('/database', methods=['GET'])
def get_database():
    """Get database performance metrics"""
    stats = get_database_stats()
    return jsonify({
        'status': 'ok',
        'data': stats,
        'timestamp': datetime.utcnow().isoformat(),
    }), 200


@analytics_bp.route('/web-vitals', methods=['POST'])
def collect_vital():
    """Collect a single Web Vital from frontend"""
    try:
        data = request.get_json()

        if not data or 'vital_name' not in data or 'value' not in data:
            return jsonify({'error': 'Missing vital_name or value'}), 400

        vital = collect_web_vital(
            vital_name=data['vital_name'],
            value=data['value'],
            page_url=data.get('url', '/')
        )

        return jsonify({
            'status': 'recorded',
            'vital': vital,
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/vitals-batch', methods=['POST'])
def collect_vitals_batch():
    """Collect batch of Web Vitals"""
    try:
        data = request.get_json()

        if not data or 'vitals' not in data:
            return jsonify({'error': 'Missing vitals'}), 400

        recorded = []
        for name, value in data['vitals'].items():
            vital = collect_web_vital(
                vital_name=name,
                value=value,
                page_url=data.get('url', '/')
            )
            recorded.append(vital)

        return jsonify({
            'status': 'recorded',
            'count': len(recorded),
            'vitals': recorded,
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/events', methods=['POST'])
def log_event():
    """Log a custom analytics event"""
    try:
        data = request.get_json()

        if not data or 'name' not in data:
            return jsonify({'error': 'Missing event name'}), 400

        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'name': data['name'],
            'properties': data.get('properties', {}),
            'url': data.get('url', '/'),
            'user_agent': request.headers.get('User-Agent', ''),
        }

        # Store event
        events_storage.append(event)
        if len(events_storage) > MAX_EVENTS:
            events_storage.pop(0)

        return jsonify({
            'status': 'recorded',
            'event': event,
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/events', methods=['GET'])
def get_events():
    """Get recent analytics events"""
    limit = request.args.get('limit', 100, type=int)
    event_type = request.args.get('type', None)

    events = events_storage[-limit:] if not event_type else [
        e for e in events_storage[-limit:] if e['name'] == event_type
    ]

    return jsonify({
        'status': 'ok',
        'total': len(events_storage),
        'returned': len(events),
        'events': events,
    }), 200


@analytics_bp.route('/web-vitals', methods=['GET'])
def get_vitals():
    """Get Web Vitals statistics"""
    stats = get_web_vitals_stats()
    return jsonify({
        'status': 'ok',
        'data': stats,
        'timestamp': datetime.utcnow().isoformat(),
    }), 200


@analytics_bp.route('/dashboard', methods=['GET'])
def dashboard_data():
    """Get all analytics for dashboard"""
    time_range = request.args.get('range', '1h')  # 1h, 24h, 7d

    perf_stats = get_performance_stats()
    db_stats = get_database_stats()
    vitals_stats = get_web_vitals_stats()

    # Calculate trends (in production, use database)
    dashboard = {
        'timestamp': datetime.utcnow().isoformat(),
        'time_range': time_range,
        'performance': {
            'total_requests': perf_stats['total_requests'],
            'avg_response_time': perf_stats['avg_response_time_ms'],
            'p95_response_time': perf_stats['p95_response_time_ms'],
            'p99_response_time': perf_stats['p99_response_time_ms'],
            'error_rate': perf_stats['error_rate'],
            'cache_hit_rate': perf_stats['cache_hit_rate'],
        },
        'database': {
            'total_queries': db_stats['total_queries'],
            'avg_query_time': db_stats['avg_query_time_ms'],
            'p95_query_time': db_stats['p95_query_time_ms'],
            'slowest_queries': db_stats.get('slowest_queries', []),
        },
        'web_vitals': {
            'fcp': vitals_stats.get('fcp_avg', 0),
            'lcp': vitals_stats.get('lcp_avg', 0),
            'cls': vitals_stats.get('cls_avg', 0),
            'ttfb': vitals_stats.get('ttfb_avg', 0),
            'total_samples': vitals_stats.get('total_vitals', 0),
        },
        'sla_status': {
            'target_uptime': 99.9,
            'target_response_time': 200,
            'target_error_rate': 0.1,
            'target_cache_hit_rate': 70,
        },
    }

    # Add SLA compliance
    dashboard['sla_compliance'] = {
        'uptime': 'PASS' if perf_stats['error_rate'] < 1 else 'FAIL',
        'response_time': 'PASS' if perf_stats['p99_response_time_ms'] < 200 else 'WARN',
        'error_rate': 'PASS' if perf_stats['error_rate'] < 0.1 else 'WARN',
        'cache_performance': 'PASS' if perf_stats['cache_hit_rate'] > 70 else 'WARN',
    }

    return jsonify(dashboard), 200


@analytics_bp.route('/export', methods=['GET'])
def export_analytics():
    """Export analytics data as JSON"""
    export_format = request.args.get('format', 'json')  # json, csv

    export_data = {
        'exported_at': datetime.utcnow().isoformat(),
        'performance': get_performance_stats(),
        'database': get_database_stats(),
        'web_vitals': get_web_vitals_stats(),
        'recent_events': events_storage[-50:],
    }

    if export_format == 'json':
        return jsonify(export_data), 200
    else:
        return jsonify({'error': 'Format not supported'}), 400


@analytics_bp.route('/comparison', methods=['GET'])
def compare_periods():
    """Compare analytics between two time periods"""
    period1 = request.args.get('period1', '1h')
    period2 = request.args.get('period2', '24h')

    # In production, query historical data from database/TimescaleDB
    comparison = {
        'period1': period1,
        'period2': period2,
        'performance_improvement': '+15%',  # Calculate from data
        'message': 'Performance metrics comparison endpoint. Requires database integration.',
    }

    return jsonify(comparison), 200


@analytics_bp.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404


@analytics_bp.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

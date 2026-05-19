# backend/src/config/tracing_config.py

import os
from opentelemetry import trace, metrics
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

def init_tracing():
    """Initialize OpenTelemetry tracing with Jaeger exporter"""

    jaeger_exporter = JaegerExporter(
        agent_host_name=os.getenv('JAEGER_HOST', 'localhost'),
        agent_port=int(os.getenv('JAEGER_PORT', 6831)),
    )

    trace.set_tracer_provider(TracerProvider())
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )

    return trace.get_tracer('immo2000-backend')

def init_metrics():
    """Initialize OpenTelemetry metrics"""

    prometheus_reader = PrometheusMetricReader()
    meter_provider = MeterProvider(metric_readers=[prometheus_reader])
    metrics.set_meter_provider(meter_provider)

    return metrics.get_meter('immo2000-backend')

def setup_instrumentation(app=None, db=None):
    """Setup automatic instrumentation"""

    # Flask instrumentation
    if app:
        FlaskInstrumentor().instrument_app(app)

    # SQLAlchemy instrumentation
    if db:
        SQLAlchemyInstrumentor().instrument(
            engine=db.engine,
            service=os.getenv('SERVICE_NAME', 'immo2000-backend'),
        )

    # Redis instrumentation
    RedisInstrumentor().instrument()

    # Requests instrumentation
    RequestsInstrumentor().instrument()

    # Psycopg2 instrumentation
    Psycopg2Instrumentor().instrument()

# Span context helpers
def get_current_span():
    """Get current span"""
    return trace.get_current_span()

def set_span_attribute(key: str, value):
    """Set span attribute"""
    span = get_current_span()
    span.set_attribute(key, value)

def add_span_event(name: str, attributes=None):
    """Add event to current span"""
    span = get_current_span()
    span.add_event(name, attributes or {})

def record_exception(exception: Exception):
    """Record exception in span"""
    span = get_current_span()
    span.record_exception(exception)

# Metric recording helpers
_meter = None

def get_meter():
    """Get meter instance"""
    global _meter
    if _meter is None:
        _meter = init_metrics()
    return _meter

def record_counter(name: str, value: int, attributes=None):
    """Record counter metric"""
    meter = get_meter()
    counter = meter.create_counter(name)
    counter.add(value, attributes or {})

def record_histogram(name: str, value: float, attributes=None):
    """Record histogram metric"""
    meter = get_meter()
    histogram = meter.create_histogram(name)
    histogram.record(value, attributes or {})

def record_gauge(name: str, value: float, attributes=None):
    """Record gauge metric"""
    meter = get_meter()
    gauge = meter.create_observable_gauge(
        name,
        lambda: [(value, attributes or {})],
    )

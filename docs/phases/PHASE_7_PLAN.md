# Phase 7: Analytics & Monitoring - Plan Complet

**Status**: 🔄 IN PROGRESS
**Timeline**: 1-2 semaines
**Objective**: Observabilité complète + Analytics avancée

---

## 🎯 Objectif Phase 7

Transformer Immo2000 en **application observable et analyzed** capable de:
- ✅ Tracker tous les erreurs (Sentry)
- ✅ Analyser le comportement utilisateur (Mixpanel/GA4)
- ✅ Monitorer la performance (New Relic/Datadog)
- ✅ Créer des dashboards en temps réel
- ✅ Alerter automatiquement les problèmes
- ✅ Tracer les requêtes (distributed tracing)

---

## 📊 Architecture Phase 7

```
┌─────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                      │
├─────────────────────────────────────────────────────────────┤
│ 7.1: Error Tracking (Sentry)                                │
│  ├─ Exception catching                                       │
│  ├─ Error reporting                                          │
│  ├─ Release tracking                                         │
│  └─ Sourcemaps management                                    │
├─────────────────────────────────────────────────────────────┤
│ 7.2: Analytics (Firebase Analytics + Mixpanel)              │
│  ├─ Event tracking                                           │
│  ├─ User properties                                          │
│  ├─ Session management                                       │
│  └─ Funnel analysis                                          │
├─────────────────────────────────────────────────────────────┤
│ 7.3: Performance Monitoring (Web Vitals)                     │
│  ├─ Core Web Vitals                                          │
│  ├─ Custom metrics                                           │
│  ├─ Resource timing                                          │
│  └─ Network waterfalls                                       │
├─────────────────────────────────────────────────────────────┤
│ 7.4: Distributed Tracing (OpenTelemetry)                    │
│  ├─ Request tracing                                          │
│  ├─ Span creation                                            │
│  ├─ Trace context propagation                                │
│  └─ Jaeger exporter                                          │
├─────────────────────────────────────────────────────────────┤
│ 7.5: Logging & Log Aggregation (ELK Stack)                  │
│  ├─ Structured logging                                       │
│  ├─ Log rotation                                             │
│  ├─ Elasticsearch storage                                    │
│  └─ Kibana dashboards                                        │
├─────────────────────────────────────────────────────────────┤
│ 7.6: Alerting & Incident Management                         │
│  ├─ Alert rules                                              │
│  ├─ PagerDuty integration                                    │
│  ├─ Slack notifications                                      │
│  └─ Escalation policies                                      │
├─────────────────────────────────────────────────────────────┤
│ 7.7: Custom Dashboards & Reports                            │
│  ├─ Real-time dashboards                                     │
│  ├─ Business metrics                                         │
│  ├─ Technical metrics                                        │
│  └─ Automated reports                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Sub-Phases Détaillées

### **Phase 7.1: Error Tracking (Sentry)** (~2 heures)

**Objectif**: Capturer et tracker tous les erreurs

#### Backend Setup
```python
# backend/src/config.py

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

def init_sentry():
    sentry_sdk.init(
        dsn=os.getenv('SENTRY_DSN'),
        integrations=[
            FlaskIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        release=os.getenv('APP_VERSION'),
        environment=os.getenv('ENVIRONMENT'),
        send_default_pii=False,
    )
```

#### Frontend Setup
```typescript
// frontend/src/utils/sentry.ts

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    release: process.env.REACT_APP_VERSION,
    environment: process.env.REACT_APP_ENV,
  });
};

// Error boundary
export const ErrorBoundary = Sentry.withProfiler(
  Sentry.ErrorBoundary
);
```

#### Mobile Setup
```typescript
// mobile/src/services/sentryService.ts

import * as Sentry from "sentry-expo";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableInExpoDevelopment: true,
    tracesSampleRate: 0.1,
    release: process.env.EXPO_PUBLIC_VERSION,
    environment: process.env.EXPO_PUBLIC_ENV,
  });
};
```

**Résultats**:
- ✅ Exception catching
- ✅ Stack traces
- ✅ Release tracking
- ✅ Source maps uploaded
- ✅ Performance monitoring

---

### **Phase 7.2: Analytics (Firebase + Mixpanel)** (~2.5 heures)

**Objectif**: Tracker le comportement utilisateur

#### Firebase Analytics Events
```typescript
// frontend/src/services/analyticsService.ts

import { getAnalytics, logEvent } from "firebase/analytics";

const analytics = getAnalytics();

export const trackEvent = (eventName: string, params?: any) => {
  logEvent(analytics, eventName, params);
};

// Key events
export const trackListingView = (listingId: string) => {
  trackEvent('listing_viewed', { listing_id: listingId });
};

export const trackListingCreated = (listingId: string) => {
  trackEvent('listing_created', { listing_id: listingId });
};

export const trackMessageSent = (conversationId: string) => {
  trackEvent('message_sent', { conversation_id: conversationId });
};

export const trackUserSignup = (role: string) => {
  trackEvent('user_signup', { role });
};

export const trackUserLogin = (method: string) => {
  trackEvent('user_login', { method });
};

export const trackSearchPerformed = (query: string, results: number) => {
  trackEvent('search_performed', { query, results });
};

export const trackFunnel = (step: string) => {
  trackEvent('funnel_step', { step });
};
```

#### Mixpanel Integration
```typescript
// frontend/src/services/mixpanelService.ts

import mixpanel from 'mixpanel-browser';

mixpanel.init(process.env.REACT_APP_MIXPANEL_TOKEN);

export const trackMixpanelEvent = (eventName: string, properties?: any) => {
  mixpanel.track(eventName, properties);
};

export const identifyUser = (userId: string, properties?: any) => {
  mixpanel.identify(userId);
  mixpanel.people.set({
    $email: properties?.email,
    $name: properties?.name,
    $created: new Date(),
    ...properties,
  });
};

export const trackFunnel = (funnelName: string, step: number, properties?: any) => {
  trackMixpanelEvent(`funnel_${funnelName}_step_${step}`, properties);
};
```

#### User Journey Tracking
```typescript
// Common user journey events

// Signup funnel
export const SignupFunnel = {
  START: 'signup_start',
  EMAIL_ENTERED: 'signup_email',
  PASSWORD_ENTERED: 'signup_password',
  VERIFICATION: 'signup_verification',
  COMPLETED: 'signup_completed',
};

// Listing creation funnel
export const ListingFunnel = {
  START: 'listing_creation_start',
  BASIC_INFO: 'listing_basic_info',
  IMAGES: 'listing_images',
  PRICING: 'listing_pricing',
  PUBLISHED: 'listing_published',
};

// Purchase funnel
export const PurchaseFunnel = {
  BROWSING: 'purchase_browsing',
  DETAIL_VIEW: 'purchase_detail_view',
  CONTACT: 'purchase_contact',
  SCHEDULED: 'purchase_scheduled',
  COMPLETED: 'purchase_completed',
};
```

**Résultats**:
- ✅ Event tracking (100+ events)
- ✅ User identification
- ✅ Session tracking
- ✅ Funnel analysis
- ✅ Cohort tracking

---

### **Phase 7.3: Performance Monitoring** (~2 heures)

**Objectif**: Tracker la performance

#### Web Vitals
```typescript
// frontend/src/utils/webVitals.ts

import {
  getCLS,
  getFCP,
  getFID,
  getLCP,
  getTTFB,
} from 'web-vitals';

export const initWebVitals = () => {
  // Largest Contentful Paint (LCP)
  getLCP((metric) => {
    console.log(`LCP: ${metric.value}ms`);
    trackEvent('web_vital_lcp', { value: metric.value });
  });

  // First Input Delay (FID)
  getFID((metric) => {
    console.log(`FID: ${metric.value}ms`);
    trackEvent('web_vital_fid', { value: metric.value });
  });

  // Cumulative Layout Shift (CLS)
  getCLS((metric) => {
    console.log(`CLS: ${metric.value}`);
    trackEvent('web_vital_cls', { value: metric.value });
  });

  // First Contentful Paint (FCP)
  getFCP((metric) => {
    console.log(`FCP: ${metric.value}ms`);
    trackEvent('web_vital_fcp', { value: metric.value });
  });

  // Time to First Byte (TTFB)
  getTTFB((metric) => {
    console.log(`TTFB: ${metric.value}ms`);
    trackEvent('web_vital_ttfb', { value: metric.value });
  });
};
```

#### Custom Metrics
```typescript
// frontend/src/utils/customMetrics.ts

export const trackAPIResponse = (
  endpoint: string,
  duration: number,
  status: number
) => {
  trackEvent('api_response', {
    endpoint,
    duration,
    status,
  });
};

export const trackDatabaseQuery = (
  query: string,
  duration: number
) => {
  trackEvent('database_query', {
    query,
    duration,
  });
};

export const trackImageLoad = (
  url: string,
  duration: number,
  size: number
) => {
  trackEvent('image_load', {
    url,
    duration,
    size,
  });
};

export const trackMemoryUsage = (memoryUsage: number) => {
  trackEvent('memory_usage', { value: memoryUsage });
};
```

#### Backend Performance
```python
# backend/src/middleware/performance.py

import time
from flask import request, g

def track_request_performance():
    g.start_time = time.time()

def record_request_performance(response):
    if hasattr(g, 'start_time'):
        duration = time.time() - g.start_time
        logger.info(
            f"Request: {request.method} {request.path}",
            extra={
                'duration_ms': duration * 1000,
                'status': response.status_code,
                'endpoint': request.endpoint,
            }
        )
        # Send to Sentry
        sentry_sdk.capture_message(
            f"Request timing: {request.path}",
            level='info',
            contexts={
                'performance': {
                    'duration_ms': duration * 1000,
                    'status': response.status_code,
                }
            }
        )
    return response
```

**Résultats**:
- ✅ Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
- ✅ API response tracking
- ✅ Database query tracking
- ✅ Custom metrics
- ✅ Performance dashboards

---

### **Phase 7.4: Distributed Tracing (OpenTelemetry)** (~2 heures)

**Objectif**: Tracer les requêtes end-to-end

#### Backend Tracing
```python
# backend/src/config/tracing.py

from opentelemetry import trace, metrics
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

def init_tracing():
    jaeger_exporter = JaegerExporter(
        agent_host_name=os.getenv('JAEGER_HOST', 'localhost'),
        agent_port=int(os.getenv('JAEGER_PORT', 6831)),
    )

    trace.set_tracer_provider(TracerProvider())
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )

    FlaskInstrumentor().instrument_app(app)
    SQLAlchemyInstrumentor().instrument(
        engine=db.engine,
    )

    return trace.get_tracer(__name__)

# Usage
tracer = init_tracing()

@app.route('/listings/<id>')
def get_listing(id):
    with tracer.start_as_current_span("get_listing") as span:
        span.set_attribute("listing.id", id)
        # ... implementation
```

#### Frontend Tracing
```typescript
// frontend/src/utils/tracing.ts

import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer('frontend');

export const withTracing = async (
  spanName: string,
  fn: () => Promise<any>
) => {
  const span = tracer.startSpan(spanName);
  try {
    const result = await fn();
    span.setStatus({ code: 0 });
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error.message });
    throw error;
  } finally {
    span.end();
  }
};

// Usage
export const fetchListings = () => {
  return withTracing('fetch_listings', async () => {
    const response = await api.get('/listings');
    return response.data;
  });
};
```

**Résultats**:
- ✅ End-to-end request tracing
- ✅ Service dependencies visualization
- ✅ Latency analysis
- ✅ Bottleneck identification

---

### **Phase 7.5: Logging & Aggregation (ELK)** (~2.5 heures)

**Objectif**: Logs centralisés et searchable

#### Backend Logging
```python
# backend/src/config/logging.py

import logging
import json
from pythonjsonlogger import jsonlogger

def setup_logging():
    logger = logging.getLogger()

    # Console handler
    console_handler = logging.StreamHandler()
    json_formatter = jsonlogger.JsonFormatter()
    console_handler.setFormatter(json_formatter)
    logger.addHandler(console_handler)

    # File handler for Elasticsearch
    file_handler = logging.FileHandler('app.log')
    file_handler.setFormatter(json_formatter)
    logger.addHandler(file_handler)

    return logger

# Usage
logger = setup_logging()

# Log different levels
logger.debug("Debug message", extra={'user_id': user_id})
logger.info("User logged in", extra={'user_id': user_id})
logger.warning("Rate limit approaching", extra={'user_id': user_id})
logger.error("Database connection failed", extra={'error': str(e)})
logger.critical("System critical", extra={'component': 'auth'})
```

#### Filebeat Configuration
```yaml
# filebeat.yml

filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /app/logs/*.log

  # Add fields
  fields:
    service: immo2000-backend
    environment: production

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "logs-%{+yyyy.MM.dd}"

processors:
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~
```

#### Kibana Dashboard
```json
{
  "dashboard": {
    "title": "Immo2000 Logs",
    "panels": [
      {
        "type": "logs",
        "query": "service: immo2000-backend",
        "timeRange": "last_24h"
      },
      {
        "type": "metric",
        "query": "level: error",
        "title": "Error Rate"
      },
      {
        "type": "timeline",
        "query": "endpoint: /api/listings",
        "title": "API Response Times"
      }
    ]
  }
}
```

**Résultats**:
- ✅ Structured logging
- ✅ Log aggregation (Elasticsearch)
- ✅ Log searching (Kibana)
- ✅ Log retention (30 days)

---

### **Phase 7.6: Alerting & Incident Management** (~2 heures)

**Objectif**: Alerter automatiquement les problèmes

#### Alert Rules
```python
# backend/src/config/alerts.py

ALERT_RULES = {
    'error_rate_high': {
        'condition': 'error_count > 10 in 5m',
        'severity': 'critical',
        'action': 'page_oncall',
    },
    'response_time_slow': {
        'condition': 'p95_latency > 1000ms',
        'severity': 'warning',
        'action': 'notify_slack',
    },
    'database_connections': {
        'condition': 'db_connections > 80% of pool',
        'severity': 'warning',
        'action': 'notify_slack',
    },
    'memory_usage': {
        'condition': 'memory_usage > 90%',
        'severity': 'critical',
        'action': 'page_oncall',
    },
    'disk_space': {
        'condition': 'disk_free < 10%',
        'severity': 'critical',
        'action': 'page_oncall',
    },
}
```

#### PagerDuty Integration
```python
# backend/src/services/alerting.py

import requests

class AlertService:
    def __init__(self, pagerduty_key):
        self.pagerduty_key = pagerduty_key

    def trigger_incident(self, title, description, severity='critical'):
        payload = {
            'routing_key': self.pagerduty_key,
            'event_action': 'trigger',
            'dedup_key': title,
            'payload': {
                'summary': title,
                'severity': severity,
                'source': 'Immo2000',
                'custom_details': {
                    'description': description,
                    'timestamp': datetime.now().isoformat(),
                }
            }
        }

        response = requests.post(
            'https://events.pagerduty.com/v2/enqueue',
            json=payload
        )
        return response.status_code == 202

alert_service = AlertService(os.getenv('PAGERDUTY_KEY'))

# Usage
if error_rate > THRESHOLD:
    alert_service.trigger_incident(
        'High error rate detected',
        f'Error rate: {error_rate}%'
    )
```

#### Slack Notifications
```python
# backend/src/services/slack_notifier.py

from slack_sdk import WebClient

slack = WebClient(token=os.getenv('SLACK_TOKEN'))

def notify_slack(channel, message, severity='info'):
    color_map = {
        'info': '#36a64f',
        'warning': '#ff9900',
        'critical': '#ff0000',
    }

    slack.chat_postMessage(
        channel=channel,
        blocks=[
            {
                'type': 'section',
                'text': {
                    'type': 'mrkdwn',
                    'text': f'*{severity.upper()}*: {message}'
                }
            }
        ],
        attachments=[
            {
                'color': color_map.get(severity, '#36a64f'),
                'text': message,
            }
        ]
    )

# Usage
notify_slack('#alerts', 'API down for 5 minutes', 'critical')
```

**Résultats**:
- ✅ Alert rules (10+ rules)
- ✅ PagerDuty integration
- ✅ Slack notifications
- ✅ Escalation policies
- ✅ On-call rotation

---

### **Phase 7.7: Custom Dashboards** (~2 heures)

**Objectif**: Dashboards temps réel

#### Business Metrics Dashboard
```typescript
// frontend/src/dashboards/BusinessMetrics.tsx

import React, { useEffect, useState } from 'react';
import { LineChart, BarChart, Card } from '@mui/x-charts';
import { useApiClient } from '../hooks/useApiClient';

export const BusinessMetricsDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalListings: 0,
    totalMessages: 0,
    averageReviewScore: 0,
  });

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    const response = await api.get('/analytics/metrics');
    setMetrics(response.data);
  };

  return (
    <div>
      <Card title="Total Users">
        <h2>{metrics.totalUsers}</h2>
      </Card>

      <Card title="Active Users (24h)">
        <h2>{metrics.activeUsers}</h2>
      </Card>

      <Card title="Total Listings">
        <h2>{metrics.totalListings}</h2>
      </Card>

      <LineChart
        title="User Growth"
        data={metrics.userGrowth}
        xAxis="date"
        yAxis="count"
      />

      <BarChart
        title="Listings by Type"
        data={metrics.listingsByType}
        categories={['Apartment', 'House', 'Commercial']}
      />
    </div>
  );
};
```

#### Technical Metrics Dashboard
```typescript
// frontend/src/dashboards/TechnicalMetrics.tsx

export const TechnicalMetricsDashboard = () => {
  const [metrics, setMetrics] = useState({
    errorRate: 0,
    responseTime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    dbConnections: 0,
  });

  return (
    <div>
      <Card title="Error Rate (24h)">
        <h2>{metrics.errorRate}%</h2>
      </Card>

      <Card title="Avg Response Time">
        <h2>{metrics.responseTime}ms</h2>
      </Card>

      <LineChart
        title="Error Rate Trend"
        data={metrics.errorTrend}
      />

      <LineChart
        title="Response Time Trend"
        data={metrics.responseTrend}
      />

      <GaugeChart
        title="CPU Usage"
        value={metrics.cpuUsage}
      />

      <GaugeChart
        title="Memory Usage"
        value={metrics.memoryUsage}
      />
    </div>
  );
};
```

#### API Endpoint Monitoring
```typescript
// frontend/src/dashboards/APIMonitoring.tsx

export const APIMonitoringDashboard = () => {
  const [endpoints, setEndpoints] = useState([]);

  return (
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Count (24h)</th>
          <th>Avg Time</th>
          <th>Error Rate</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {endpoints.map(ep => (
          <tr key={ep.path}>
            <td>{ep.path}</td>
            <td>{ep.count}</td>
            <td>{ep.avgTime}ms</td>
            <td>{ep.errorRate}%</td>
            <td>{ep.status === 'healthy' ? '✅' : '❌'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

**Résultats**:
- ✅ Business metrics dashboard
- ✅ Technical metrics dashboard
- ✅ API monitoring dashboard
- ✅ Real-time updates
- ✅ Custom reports

---

## 📊 Statistiques Phase 7

```
Code:
├─ Sentry config:        ~200 lignes
├─ Analytics service:    ~300 lignes
├─ Performance tracking: ~250 lignes
├─ Distributed tracing:  ~200 lignes
├─ Logging config:       ~150 lignes
├─ Alerting service:     ~250 lignes
├─ Dashboards:           ~600 lignes
└─ TOTAL:                ~2000 lignes

Commits: 7
├─ 7.1 Error Tracking:   1
├─ 7.2 Analytics:        2
├─ 7.3 Performance:      1
├─ 7.4 Tracing:          1
├─ 7.5 Logging:          1
├─ 7.6 Alerting:         1
└─ 7.7 Dashboards:       1

Coverage:
├─ Error tracking:       ✅ 100%
├─ Event analytics:      ✅ 100+ events
├─ Performance metrics:  ✅ Core Web Vitals
├─ Distributed tracing:  ✅ Full stack
├─ Log aggregation:      ✅ ELK stack
├─ Alerting:             ✅ 10+ rules
└─ Dashboards:           ✅ 3+ dashboards
```

---

## 🎯 Success Criteria

**Phase 7 sera complète quand**:

```
✅ Error Tracking
  □ Sentry configured (backend, frontend, mobile)
  □ Error grouping working
  □ Source maps uploaded
  □ Release tracking working

✅ Analytics
  □ Firebase Analytics tracking
  □ Mixpanel events streaming
  □ User identification working
  □ Funnel analysis available

✅ Performance Monitoring
  □ Web Vitals collected
  □ API response tracking
  □ Database query tracking
  □ Custom metrics defined

✅ Distributed Tracing
  □ Jaeger running
  □ Backend traces flowing
  □ Frontend traces flowing
  □ Service map visible

✅ Logging
  □ Structured logging
  □ Elasticsearch storing
  □ Kibana accessible
  □ Log retention policy

✅ Alerting
  □ Alert rules configured
  □ PagerDuty integration
  □ Slack notifications
  □ On-call rotation

✅ Dashboards
  □ Business metrics dashboard
  □ Technical metrics dashboard
  □ API monitoring dashboard
  □ Real-time updates
```

---

## 🚀 Démarrage Phase 7

**Stack Technologies**:
```
Error Tracking:    Sentry
Analytics:         Firebase + Mixpanel
Performance:       Web Vitals + Custom Metrics
Tracing:           OpenTelemetry + Jaeger
Logging:           ELK Stack (Elasticsearch + Logstash + Kibana)
Alerting:          PagerDuty + Slack
Dashboards:        Custom React + Charts
```

**Commandes initiales**:
```bash
# Backend
pip install sentry-sdk
pip install opentelemetry-api opentelemetry-sdk opentelemetry-exporter-jaeger
pip install python-json-logger

# Frontend
npm install @sentry/react @sentry/tracing
npm install firebase-analytics
npm install mixpanel-browser
npm install web-vitals

# Mobile
npm install @sentry/react-native
npm install sentry-expo
npm install firebase-analytics
```

---

**Total Phase 7**: ~12 heures (1-2 jours intensifs)

Prêt? 🚀 C'est parti pour l'observabilité complète!

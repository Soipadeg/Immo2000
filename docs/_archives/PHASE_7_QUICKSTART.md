# PHASE_7_QUICKSTART.md

# Phase 7 Quick Start Guide

## Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Git
- Environment variables configured

## 1. Environment Setup (5 minutes)

### Copy Phase 7 Configuration
```bash
cp .env.phase7 .env.local
```

### Update with Your Credentials
```bash
# Edit .env.phase7
SENTRY_DSN=https://your-key@sentry.io/your-project
FIREBASE_API_KEY=your-firebase-key
MIXPANEL_TOKEN=your-mixpanel-token
PAGERDUTY_KEY=your-pagerduty-key
SLACK_TOKEN=xoxb-your-slack-token
```

## 2. Start Monitoring Infrastructure (10 minutes)

```bash
# Start all monitoring services
docker-compose -f docker-compose-monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose-monitoring.yml ps

# Check logs
docker-compose -f docker-compose-monitoring.yml logs -f
```

**Services Ready**:
- Sentry: http://localhost:9000
- Jaeger: http://localhost:16686
- Elasticsearch: http://localhost:9200
- Kibana: http://localhost:5601
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## 3. Backend Integration (15 minutes)

### Install Dependencies
```bash
pip install sentry-sdk python-json-logger opentelemetry-api opentelemetry-sdk
pip install opentelemetry-exporter-jaeger opentelemetry-instrumentation-flask
pip install slack-sdk requests psutil
```

### Initialize in Application
```python
# In backend/run_server.py or app.py

from src.config.sentry_config import init_sentry
from src.config.logging_config import setup_logging
from src.config.tracing_config import init_tracing, setup_instrumentation
from src.middleware.observability_middleware import ObservabilityMiddleware

# Create Flask app
app = Flask(__name__)

# Initialize monitoring (order matters!)
init_sentry(app)
setup_logging()
init_tracing()
setup_instrumentation(app, db)
ObservabilityMiddleware(app)

# Run app
if __name__ == '__main__':
    app.run(debug=True)
```

### Test Backend Integration
```bash
# Trigger a test error
curl http://localhost:5000/api/test-error

# Check Sentry dashboard
# http://localhost:9000
```

## 4. Frontend Integration (15 minutes)

### Install Dependencies
```bash
npm install @sentry/react @sentry/tracing web-vitals firebase
npm install mixpanel-browser
```

### Initialize in React
```typescript
// In frontend/src/index.tsx or App.tsx

import { initSentry } from './services/sentryService';
import { initPerformanceTracking } from './services/performanceService';
import { analytics } from './services/analyticsService';

// Initialize Sentry (before anything else)
initSentry();

// Initialize performance tracking
initPerformanceTracking();

// Initialize analytics
analytics.setUserId(user?.id);

// App initialization
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

### Track Events
```typescript
import { trackingEvents, funnels } from './services/analyticsService';

// Track signup
funnels.signup.start();
// ... user fills form ...
funnels.signup.completed();

// Track listing view
trackingEvents.listingViewed('listing-123');

// Track search
trackingEvents.searchPerformed('paris apartments', 42);
```

## 5. Mobile Integration (10 minutes)

### Install Dependencies
```bash
expo install @sentry/react-native firebase
expo install expo-analytics firebase-analytics
```

### Initialize in React Native
```typescript
// In mobile/src/App.tsx

import { initSentry } from './services/sentryService';
import { mobileAnalytics } from './services/analyticsService';

// Initialize Sentry
initSentry();

// Initialize analytics
mobileAnalytics.setUserId(user?.id);

export default function App() {
  return (
    <ErrorBoundary>
      <RootNavigator />
    </ErrorBoundary>
  );
}
```

### Track Mobile Events
```typescript
import { mobileAnalytics } from './services/analyticsService';

// Track login
mobileAnalytics.trackLogin('email');

// Track listing view
mobileAnalytics.trackListingViewed('listing-123', 250000);

// Track image upload
mobileAnalytics.trackImageUploaded(1048576, 5000); // 1MB, 5s

// Track offline sync
mobileAnalytics.trackDataSync(50, 2000); // 50 items, 2s
```

## 6. Create Alerts (5 minutes)

### Slack Setup
1. Create Slack workspace
2. Get bot token from https://api.slack.com/apps
3. Add to channels: #alerts, #incidents
4. Set SLACK_TOKEN in .env.phase7

### PagerDuty Setup
1. Create PagerDuty account
2. Create integration service
3. Get integration key
4. Set PAGERDUTY_KEY in .env.phase7

### Test Alerts
```bash
# In Python shell
from src.services.alerting_service import get_alert_service

alert_service = get_alert_service()

# Test Slack
alert_service.send_slack_alert(
    title='Test Alert',
    message='This is a test alert',
    context={'test': True}
)

# Test PagerDuty
alert_service.trigger_pagerduty_incident(
    title='Test Incident',
    description='This is a test incident',
)
```

## 7. Verify Setup (5 minutes)

### Backend Checks
```bash
# Generate test data
python -c "
from src.services.monitoring_service import get_monitoring_service
m = get_monitoring_service()

# Record test error
m.record_error('TestError', 'Test error message')

# Record test request
m.record_request_time('/api/test', 'GET', 0.150)

# Print stats
print('Errors:', m.get_error_summary())
print('Endpoints:', m.get_all_endpoint_stats())
"
```

### Frontend Checks
```typescript
// In browser console
import { performanceService } from './services/performanceService';

// Get Web Vitals
const vitals = {
  lcp: performanceService.getNavigationTiming().lcp,
  fcp: performanceService.getNavigationTiming().fcp,
  memory: performance.memory
};

console.log('Web Vitals:', vitals);
```

### View Dashboards
1. **Jaeger**: http://localhost:16686 → Search for spans
2. **Kibana**: http://localhost:5601 → View logs
3. **Prometheus**: http://localhost:9090 → Graph metrics
4. **Grafana**: http://localhost:3000 → View dashboards
5. **Sentry**: http://localhost:9000 → Check errors

## 8. Configuration Reference

### Key Environment Variables
```bash
# Error Tracking
SENTRY_DSN=                          # Sentry project DSN
SENTRY_TRACES_RATE=0.1              # Trace sample rate (10%)
SENTRY_PROFILES_RATE=0.1            # Profile sample rate (10%)

# Analytics
REACT_APP_MIXPANEL_TOKEN=           # Mixpanel token
FIREBASE_API_KEY=                   # Firebase API key
FIREBASE_PROJECT_ID=                # Firebase project ID

# Infrastructure
JAEGER_HOST=localhost               # Jaeger server
JAEGER_PORT=6831                    # Jaeger UDP port
ELASTICSEARCH_HOST=localhost:9200   # Elasticsearch endpoint

# Alerts
SLACK_TOKEN=                        # Slack bot token
SLACK_ALERTS_CHANNEL=#alerts        # Slack channel for alerts
PAGERDUTY_KEY=                      # PagerDuty integration key

# Thresholds
ERROR_RATE_THRESHOLD=5.0            # Alert if >5% errors
RESPONSE_TIME_THRESHOLD=1000        # Alert if >1s response
MEMORY_THRESHOLD=85                 # Alert if >85% memory
```

### Alert Thresholds
```python
# Adjust in backend code as needed
ERROR_RATE_THRESHOLD = 5.0      # percent
RESPONSE_TIME_THRESHOLD = 1000  # milliseconds
DB_QUERY_TIME_THRESHOLD = 100   # milliseconds
MEMORY_THRESHOLD = 85           # percent
CPU_THRESHOLD = 80              # percent
DISK_THRESHOLD = 90             # percent
```

## 9. Common Issues & Solutions

### Sentry Not Receiving Errors
```python
# Check if Sentry is initialized
import sentry_sdk
print(sentry_sdk.Hub.current.client)

# Force capture
sentry_sdk.capture_message('Test message')
```

### Elasticsearch Connection Failed
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Restart Elasticsearch
docker-compose -f docker-compose-monitoring.yml restart elasticsearch
```

### Prometheus Not Scraping Metrics
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify service endpoints are accessible
curl http://localhost:5000/metrics
```

### Jaeger Not Receiving Traces
```python
# Check if tracing is initialized
from src.config.tracing_config import get_current_span
span = get_current_span()
print(f'Span: {span}')
```

### Slack Notifications Not Working
```python
# Test Slack connection
from src.services.alerting_service import get_alert_service
service = get_alert_service()
success = service.send_slack_alert(
    title='Test',
    message='Test message'
)
print(f'Success: {success}')
```

## 10. Performance Tuning

### Reduce Overhead
```python
# Lower sampling rates for high-traffic scenarios
SENTRY_TRACES_RATE = 0.01  # 1% of requests
SENTRY_PROFILES_RATE = 0.01  # 1% of requests

# Reduce metric collection
METRICS_ENABLED = True if ENVIRONMENT == 'production' else False
```

### Optimize Storage
```bash
# Elasticsearch: Configure index lifecycle management
PUT _ilm/policy/immo2000-policy
{
  "policy": "immo2000-policy",
  "phases": {
    "hot": {
      "min_age": "0d",
      "actions": {
        "rollover": {"max_age": "7d"}
      }
    },
    "warm": {
      "min_age": "30d",
      "actions": {
        "set_priority": {"priority": 50}
      }
    },
    "delete": {
      "min_age": "90d",
      "actions": {
        "delete": {}
      }
    }
  }
}
```

## 11. Production Checklist

- [ ] Configure production Sentry project
- [ ] Setup production Firebase project
- [ ] Configure production Slack workspace
- [ ] Setup production PagerDuty account
- [ ] Configure Elasticsearch cluster (HA)
- [ ] Setup Prometheus persistence
- [ ] Configure alert rules
- [ ] Test all alert channels
- [ ] Document runbooks
- [ ] Train team on observability
- [ ] Setup log rotation
- [ ] Configure backup strategy
- [ ] Performance baseline testing
- [ ] Security audit
- [ ] Load testing

## Next Steps

1. **Customize Events**: Add business-specific analytics events
2. **Create Dashboards**: Build team Grafana dashboards
3. **Setup Runbooks**: Document incident response
4. **Train Team**: Onboard on monitoring tools
5. **Optimize Alerts**: Tune thresholds based on baseline

---

**Phase 7 Setup Complete!** 🎉

Your observability infrastructure is now operational. Start tracking errors, analytics, and performance across all platforms.

# Deployment & DevOps Guide - Immo2000

**Version**: 1.0
**Status**: ✅ Production Ready
**Target Environments**: Development, Staging, Production
**Last Updated**: Phase 4 Documentation

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Docker & Containerization](#docker--containerization)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (58 frontend + 35 backend tests)
- [ ] No console errors or warnings
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Dependencies up to date

### Infrastructure
- [ ] Domain registered and SSL certificate obtained
- [ ] Database server provisioned
- [ ] Redis cache configured
- [ ] AWS S3 bucket created
- [ ] CDN configured (CloudFront or Cloudflare)

### Third-Party Services
- [ ] Stripe account configured with production keys
- [ ] DocuSign account configured for production
- [ ] SendGrid email service configured
- [ ] Sentry or New Relic for error tracking
- [ ] CloudWatch or datadog for monitoring

### Security
- [ ] Secrets stored in secure vault (not in code)
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection verified
- [ ] CSRF tokens implemented
- [ ] Password hashing verified (bcrypt)

### Documentation
- [ ] API documentation complete (✅ DONE)
- [ ] Deployment runbook prepared
- [ ] Rollback procedures documented
- [ ] Incident response plan ready
- [ ] User documentation complete (✅ DONE)

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (`node --version`)
- Python 3.11+ (`python --version`)
- PostgreSQL 14+ (`psql --version`)
- Redis 6.0+ (`redis-cli --version`)
- Git (`git --version`)
- Docker & Docker Compose (optional but recommended)

### 1. Clone Repository
```bash
git clone https://github.com/yourorg/immo2000.git
cd immo2000
```

### 2. Setup Backend

```bash
cd backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with local settings:
# DATABASE_URL=postgresql://user:password@localhost:5432/immo2000_dev
# STRIPE_SECRET_KEY=sk_test_xxx
# DOCUSIGN_CLIENT_ID=xxx
# AWS_ACCESS_KEY_ID=xxx
# AWS_SECRET_ACCESS_KEY=xxx

# Initialize database
python init_db_and_user.py

# Run tests
python -m pytest tests/ -v

# Start development server
python run_server.py
# Backend runs on http://localhost:5000
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with local settings:
# VITE_API_URL=http://localhost:5000/api/v1
# VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
# VITE_DOCUSIGN_CLIENT_ID=xxx

# Run tests
npm test -- --run

# Start development server
npm run dev
# Frontend runs on http://localhost:5173 (Vite) or http://localhost:3000
```

### 4. Verify Setup

```bash
# Terminal 1: Backend
cd backend && python run_server.py
# Wait for "Running on http://localhost:5000"

# Terminal 2: Frontend
cd frontend && npm run dev
# Wait for "Local: http://localhost:5173"

# Terminal 3: Test
curl http://localhost:5000/api/v1/health
# Should return {"status": "healthy"}

# Open browser
open http://localhost:5173
# Should see Immo2000 interface
```

---

## Docker & Containerization

### Build Docker Images

**Backend Image**:
```bash
cd backend
docker build -f Dockerfile -t immo2000-backend:latest .
```

**Frontend Image**:
```bash
cd frontend
docker build -f Dockerfile.frontend -t immo2000-frontend:latest .
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: immo2000_dev
      POSTGRES_USER: immo2000
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://immo2000:dev_password@postgres:5432/immo2000_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:5000/api/v1

volumes:
  postgres_data:
```

**Run entire stack**:
```bash
docker-compose up -d
# All services running:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Production Docker Compose

For production, use `docker-compose-monitoring.yml`:
```bash
docker-compose -f docker-compose.yml -f docker-compose-monitoring.yml up -d
# Includes Prometheus, Grafana, and alerting
```

---

## Database Setup

### Development Database

**Using PostgreSQL locally**:
```bash
# Create database
createdb immo2000_dev

# Create user
createuser immo2000 -P
# Enter password when prompted

# Grant privileges
psql -d immo2000_dev -c "GRANT ALL PRIVILEGES ON DATABASE immo2000_dev TO immo2000;"

# Run migrations
python backend/init_db_and_user.py
```

### Production Database

**Using AWS RDS PostgreSQL**:
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier immo2000-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --allocated-storage 100 \
  --master-username admin \
  --master-user-password <STRONG_PASSWORD>

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier immo2000-prod \
  --query 'DBInstances[0].Endpoint.Address'

# Set environment variable
export DATABASE_URL=postgresql://admin:password@immo2000-prod.xxx.rds.amazonaws.com:5432/immo2000

# Run migrations
python backend/init_db_and_user.py
```

### Database Backups

**Automated daily backups**:
```bash
# AWS RDS has automatic backups (35 day retention default)
# Can be configured in AWS Console or CLI

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier immo2000-prod \
  --db-snapshot-identifier immo2000-backup-$(date +%Y%m%d)

# List backups
aws rds describe-db-snapshots \
  --db-instance-identifier immo2000-prod
```

### Database Optimization

**Regular maintenance**:
```bash
# Run VACUUM ANALYZE
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check indexes
psql $DATABASE_URL -c "SELECT * FROM pg_stat_user_indexes;"

# Clear old logs
DELETE FROM pg_log WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Environment Configuration

### Development (.env.example)

```env
# Backend
FLASK_ENV=development
DEBUG=True
SECRET_KEY=dev-secret-key-123

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/immo2000_dev

# Cache
REDIS_URL=redis://localhost:6379/0

# Third-party services (use test keys)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx
DOCUSIGN_CLIENT_ID=test_client_id
DOCUSIGN_CLIENT_SECRET=test_secret

# AWS
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=immo2000-dev
AWS_REGION=eu-west-1

# Email
SENDGRID_API_KEY=SG.xxx

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET=dev-jwt-secret
JWT_EXPIRY=24h
```

### Production (.env.prod)

```env
# Backend
FLASK_ENV=production
DEBUG=False
SECRET_KEY=<GENERATE_STRONG_SECRET>

# Database
DATABASE_URL=postgresql://admin:password@immo2000-prod.xxx.rds.amazonaws.com:5432/immo2000

# Cache
REDIS_URL=redis://cache.immo2000.com:6379/0

# Third-party services (use production keys)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLIC_KEY=pk_live_xxx
DOCUSIGN_CLIENT_ID=prod_client_id
DOCUSIGN_CLIENT_SECRET=prod_secret

# AWS (production bucket)
AWS_ACCESS_KEY_ID=<PROD_KEY>
AWS_SECRET_ACCESS_KEY=<PROD_SECRET>
AWS_S3_BUCKET=immo2000-prod
AWS_REGION=eu-west-1

# Email
SENDGRID_API_KEY=SG.prod_key_xxx

# Security
CORS_ORIGINS=https://immo2000.fr,https://www.immo2000.fr
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_EXPIRY=24h

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/yyy
DATADOG_API_KEY=<PROD_KEY>

# Logging
LOG_LEVEL=INFO
```

### Secure Secrets Management

**Using AWS Secrets Manager**:
```bash
# Store secret
aws secretsmanager create-secret \
  --name immo2000/prod/database_url \
  --secret-string 'postgresql://user:pass@host:5432/db'

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id immo2000/prod/database_url
```

**Using HashiCorp Vault**:
```bash
# Store secret
vault kv put secret/immo2000/prod database_url=...

# Retrieve in application
secret = vault.kv_read('secret/immo2000/prod')
```

---

## Production Deployment

### Option 1: AWS EC2 + RDS + S3

```bash
# 1. Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.large \
  --key-name my-key \
  --security-groups immo2000-sg

# 2. SSH into instance
ssh -i my-key.pem ubuntu@<instance-ip>

# 3. Setup application
git clone https://github.com/yourorg/immo2000.git
cd immo2000

# 4. Install dependencies
./scripts/setup-prod.sh

# 5. Start services
docker-compose -f docker-compose.yml -f docker-compose-monitoring.yml up -d

# 6. Verify deployment
curl https://immo2000.fr/api/v1/health
```

### Option 2: Heroku Deployment

```bash
# 1. Create Heroku app
heroku create immo2000-prod

# 2. Set environment variables
heroku config:set FLASK_ENV=production \
  DATABASE_URL=postgresql://... \
  STRIPE_SECRET_KEY=sk_live_xxx \
  --app immo2000-prod

# 3. Deploy
git push heroku main

# 4. Run migrations
heroku run python init_db_and_user.py --app immo2000-prod

# 5. Monitor logs
heroku logs --tail --app immo2000-prod
```

### Option 3: Kubernetes (GKE/EKS)

```bash
# 1. Build and push images
docker build -t gcr.io/your-project/immo2000-backend:latest backend/
docker push gcr.io/your-project/immo2000-backend:latest

# 2. Deploy with kubectl
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml

# 3. Expose services
kubectl expose deployment immo2000-backend --type=LoadBalancer

# 4. Monitor
kubectl logs -f deployment/immo2000-backend
```

---

## Monitoring & Logging

### Application Monitoring

**Using Sentry** (error tracking):
```python
# In backend code
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    environment='production',
    traces_sample_rate=0.1
)
```

**Using Datadog** (metrics):
```bash
# Install agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<key> \
  DD_SITE="datadoghq.eu" bash -c "$(curl -L https://s3.amazonaws.com/datadoghq/scripts/install_agent/install_script.sh)"

# Monitor metrics
datadog logs --source immo2000 --service backend
```

### Infrastructure Monitoring

**Prometheus + Grafana**:
```bash
# Already configured in docker-compose-monitoring.yml
# Access Grafana: http://localhost:3000

# Pre-built dashboards:
# - API Response Times
# - Database Performance
# - Error Rates
# - User Activity
```

### Log Aggregation

**CloudWatch**:
```bash
# View logs
aws logs tail /aws/ec2/immo2000-backend --follow

# Create metric
aws logs put-metric-filter \
  --log-group-name /aws/ec2/immo2000-backend \
  --filter-name 500-errors \
  --filter-pattern '[...]status=500'
```

---

## Backup & Disaster Recovery

### Backup Strategy

**Database Backups**:
- Automated daily snapshots (AWS RDS)
- 35-day retention
- Cross-region replication
- Point-in-time recovery enabled

**File Backups**:
- S3 versioning enabled
- Cross-region replication
- Daily snapshots of user uploads
- 30-day retention

**Code Backups**:
- GitHub repository (primary)
- Automated daily exports
- Release tags for versions

### Restore Procedures

**Database Restore**:
```bash
# List available backups
aws rds describe-db-snapshots \
  --db-instance-identifier immo2000-prod

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier immo2000-restored \
  --db-snapshot-identifier immo2000-backup-20240101

# Verify restored instance
psql $RESTORED_DATABASE_URL -c "SELECT COUNT(*) FROM utilisateur;"
```

**Application Restore**:
```bash
# Rollback to previous version
git reset --hard <commit-hash>
docker-compose up -d

# OR use blue-green deployment
# Keep two production environments
# Switch traffic between them
```

---

## Troubleshooting

### Common Issues

**Issue: Database connection fails**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check network security groups
aws ec2 describe-security-groups --group-ids sg-xxx
```

**Issue: Frontend can't reach backend API**
```bash
# Check CORS configuration
curl -i -X OPTIONS http://backend:5000/api/v1/endpoint \
  -H "Origin: http://frontend:3000" \
  -H "Access-Control-Request-Method: GET"

# Check firewall rules
sudo ufw status
sudo ufw allow 5000/tcp
```

**Issue: Stripe payment failing**
```bash
# Verify API keys in use
echo "Testing secret key..."
curl https://api.stripe.com/v1/charges \
  -u sk_test_xxx: \
  -d "amount=1000&currency=usd"

# Check webhook logs
# https://dashboard.stripe.com/webhooks
```

---

**Version**: 1.0
**Last Updated**: Phase 4 Documentation
**Status**: ✅ Production Ready

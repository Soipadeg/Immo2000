# Phase 6f Production Deployment Guide

**Status**: ✅ Complete - Backend, Frontend, Database, Docker, Nginx, CI/CD
**Created**: 2026-05-19
**Updated**: 2026-05-19

---

## 📋 Prerequisites

- Docker & Docker Compose v2.0+
- PostgreSQL 14+ (for data import if needed)
- Redis 7+ (for caching)
- Git with SSH keys configured
- Linux/MacOS server with minimum 4GB RAM

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Port 80/443)                  │
│                   (Reverse Proxy, SSL)                  │
└─────────────────────────────────────────────────────────┘
                    ↙                           ↘
        ┌──────────────────┐         ┌──────────────────┐
        │    Frontend      │         │  Backend API     │
        │  (React 3001)    │         │  (FastAPI 8000)  │
        │                  │         │                  │
        │  docker build    │         │  docker build    │
        │  Dockerfile      │         │  Dockerfile.     │
        │  (node:18)       │         │  backend         │
        │                  │         │  (python:3.12)   │
        └──────────────────┘         └──────────────────┘
                                           ↙      ↘
                                    ┌────────────────────┐
                                    │   PostgreSQL 14    │
                                    │   (Port 5432)      │
                                    │   immo2000 DB      │
                                    └────────────────────┘
                                           ↙
                                    ┌────────────────────┐
                                    │   Redis 7          │
                                    │   (Port 6379)      │
                                    │   Cache/Sessions   │
                                    └────────────────────┘
```

---

## 🚀 Quick Start - Local Development

### 1. Environment Setup

```bash
# Create .env file for development
cat > backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/immo2000
REDIS_URL=redis://localhost:6379/0

# Flask
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production

# FastAPI
PORT=8000

# Integrations (from .env.example)
DOCUSIGN_CLIENT_ID=your_client_id
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_PRIVATE_KEY=your_private_key
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@immo2000.fr
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=immo2000-documents
EOF
```

### 2. Start Services

```bash
# Start all services (database, redis, backend, frontend, nginx)
docker-compose -f docker-compose-prod.yml up -d

# View logs
docker-compose -f docker-compose-prod.yml logs -f

# Access points
# - Frontend: http://localhost:3001
# - Backend API: http://localhost:8000/api/v1
# - Swagger UI: http://localhost:8000/api/v1/docs
```

### 3. Initialize Database

```bash
# Run migrations
docker-compose -f docker-compose-prod.yml exec backend python -m alembic upgrade head

# Create test user (optional)
docker-compose -f docker-compose-prod.yml exec backend python create_test_user.py

# View database
docker-compose -f docker-compose-prod.yml exec postgres psql -U postgres -d immo2000 -c "\dt"
```

### 4. Run Tests

```bash
# Run all tests
docker-compose -f docker-compose-prod.yml exec backend pytest tests/ -v

# Run specific test file
docker-compose -f docker-compose-prod.yml exec backend pytest tests/fastapi/test_webhooks_phase6g.py -v

# With coverage
docker-compose -f docker-compose-prod.yml exec backend pytest tests/ --cov=src --cov=app_fastapi --cov-report=html
```

---

## 🌍 Staging Deployment

### 1. Prepare Staging Server

```bash
# SSH into staging server
ssh ubuntu@staging.immo2000.fr

# Clone repository
cd /home/ubuntu/apps
git clone https://github.com/Soipadeg/Immo2000.git
cd Immo2000

# Create environment
cp .env.example .env.staging
# Edit with staging credentials
nano .env.staging
```

### 2. Build & Deploy

```bash
# Method 1: Automatic script
chmod +x scripts/deploy-phase6f.sh
./scripts/deploy-phase6f.sh staging

# Method 2: Manual deployment
docker-compose -f docker-compose-prod.yml --env-file .env.staging up -d
docker-compose -f docker-compose-prod.yml exec backend python -m alembic upgrade head
```

### 3. Configure Nginx (Staging)

```bash
# Copy Nginx config
sudo cp devops/nginx-prod.conf /etc/nginx/nginx.conf

# For SSL (optional, use Let's Encrypt)
sudo certbot certonly --standalone -d staging.immo2000.fr

# Update nginx.conf to use SSL
# Then reload
sudo systemctl reload nginx
```

### 4. Verify Deployment

```bash
# Health check
curl -I http://staging.immo2000.fr/health

# API test
curl http://staging.immo2000.fr/api/v1/health

# View logs
docker-compose -f docker-compose-prod.yml logs -f backend
```

---

## 🏢 Production Deployment

### 1. Production Server Setup

```bash
# SSH into production server
ssh ubuntu@app.immo2000.fr

# Create production directories
mkdir -p /home/ubuntu/apps/immo2000/data
mkdir -p /home/ubuntu/apps/immo2000/backups

# Clone repository
cd /home/ubuntu/apps
git clone https://github.com/Soipadeg/Immo2000.git immo2000
cd immo2000

# Create production environment
cp .env.example .env.production
# Edit with ALL production credentials and secrets
nano .env.production
```

### 2. Production Configuration

```env
# .env.production example
DATABASE_URL=postgresql://immo2000:STRONG_PASSWORD@postgres:5432/immo2000
REDIS_URL=redis://redis:6379/1
FLASK_ENV=production
SECRET_KEY=GENERATE_WITH: python -c "import secrets; print(secrets.token_urlsafe(32))"
PORT=8000

# DocuSign Production (not demo)
DOCUSIGN_BASE_URL=app.docusign.com
DOCUSIGN_ENVIRONMENT=production

# AWS Production Bucket
AWS_S3_BUCKET=immo2000-prod-documents
AWS_S3_REGION=eu-west-1

# All other credentials...
```

### 3. Deploy Production

```bash
# Ensure you're on main branch with latest code
git pull origin main

# Deploy with validation
chmod +x scripts/deploy-phase6f.sh
./scripts/deploy-phase6f.sh production

# Check status
docker-compose -f docker-compose-prod.yml ps
docker-compose -f docker-compose-prod.yml logs -f backend
```

### 4. Production SSL Setup

```bash
# Generate SSL certificate with Let's Encrypt
sudo certbot certonly --standalone -d app.immo2000.fr -d www.immo2000.fr -d api.immo2000.fr

# Update Nginx config to use SSL
sudo cp devops/nginx-prod.conf /etc/nginx/nginx.conf
# Uncomment SSL sections in nginx.conf

# Reload Nginx
sudo systemctl reload nginx

# Auto-renewal check
sudo systemctl start certbot-renew.timer
```

### 5. Database Backup

```bash
# Create automated backup script
cat > /home/ubuntu/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/apps/immo2000/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose-prod.yml exec -T postgres pg_dump -U postgres immo2000 | gzip > $BACKUP_DIR/immo2000_$TIMESTAMP.sql.gz
# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /home/ubuntu/backup-db.sh

# Add to crontab for daily backups at 2 AM
(crontab -l; echo "0 2 * * * /home/ubuntu/backup-db.sh") | crontab -
```

---

## 📊 Monitoring & Logging

### View Logs

```bash
# All services
docker-compose -f docker-compose-prod.yml logs -f

# Specific service
docker-compose -f docker-compose-prod.yml logs -f backend
docker-compose -f docker-compose-prod.yml logs -f nginx

# Historical logs
docker-compose -f docker-compose-prod.yml logs backend | tail -100
```

### Health Checks

```bash
# Backend health
curl -I http://localhost:8000/health

# API health
curl http://localhost:8000/api/v1/health | jq .

# Database connection
docker-compose -f docker-compose-prod.yml exec postgres pg_isready -U postgres

# Redis connection
docker-compose -f docker-compose-prod.yml exec redis redis-cli ping
```

### Metrics & Monitoring

```bash
# CPU/Memory usage
docker stats immo2000-backend-fastapi immo2000-postgres immo2000-redis

# Database stats
docker-compose -f docker-compose-prod.yml exec postgres psql -U postgres -d immo2000 -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datname='immo2000';"
```

---

## 🔄 Updates & Maintenance

### Apply Updates

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose-prod.yml build --no-cache

# Apply migrations (BEFORE restart)
docker-compose -f docker-compose-prod.yml exec backend python -m alembic upgrade head

# Restart services (one by one for zero-downtime)
docker-compose -f docker-compose-prod.yml up -d backend
sleep 10
docker-compose -f docker-compose-prod.yml up -d frontend
```

### Rollback

```bash
# Return to previous commit
git checkout HEAD~1

# Rebuild old images
docker-compose -f docker-compose-prod.yml build --no-cache

# Restart (migrations will rollback if needed)
docker-compose -f docker-compose-prod.yml down
docker-compose -f docker-compose-prod.yml up -d
```

---

## 🐛 Troubleshooting

### Backend Health Check Fails

```bash
# Check logs
docker-compose -f docker-compose-prod.yml logs backend | tail -50

# Verify database connection
docker-compose -f docker-compose-prod.yml exec backend python -c "from src.database import engine; print(engine.execute('SELECT 1').fetchone())"

# Check environment variables
docker-compose -f docker-compose-prod.yml exec backend env | grep DATABASE
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose -f docker-compose-prod.yml exec postgres pg_isready

# View PostgreSQL logs
docker-compose -f docker-compose-prod.yml logs postgres | tail -50

# Connect directly
docker-compose -f docker-compose-prod.yml exec postgres psql -U postgres
```

### Nginx 502 Bad Gateway

```bash
# Check backend is running
curl -I http://localhost:8000/health

# Check Nginx config
docker-compose -f docker-compose-prod.yml exec nginx nginx -t

# Reload Nginx
docker-compose -f docker-compose-prod.yml exec nginx nginx -s reload
```

---

## ✅ Pre-Launch Checklist

- [ ] `.env.production` created with all credentials
- [ ] SSL certificates installed (or setup with Let's Encrypt)
- [ ] Database backups configured
- [ ] All tests passing locally
- [ ] Staging deployment tested successfully
- [ ] Nginx configuration reviewed
- [ ] Health checks verified
- [ ] Monitoring setup (logs, metrics)
- [ ] Team notified of deployment time
- [ ] Rollback plan documented

---

## 📞 Support

For deployment issues:

1. Check logs: `docker-compose -f docker-compose-prod.yml logs -f`
2. Review this guide's troubleshooting section
3. Create an issue on GitHub with logs attached

---

**Last Updated**: 2026-05-19
**Version**: Phase 6f Complete

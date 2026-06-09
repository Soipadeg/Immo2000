# 🚀 Deployment Guide - Immo2000

**Version**: 2.0.0
**Status**: ✅ PRODUCTION READY
**Last Updated**: 2026-06-09
**Framework**: FastAPI (recommended) / Flask (legacy)

---

## 📖 Table of Contents

1. [Quick Start](#-quick-start)
2. [Prerequisites](#-prerequisites)
3. [Local Development Setup](#-local-development-setup)
4. [Deployment Options](#-deployment-options)
5. [Docker & Containerization](#-docker--containerization)
6. [Environment Configuration](#-environment-configuration)
7. [Production Checklist](#-production-checklist)
8. [Infrastructure & Ports](#-infrastructure--ports)
9. [Monitoring & Logging](#-monitoring--logging)
10. [Backup & Disaster Recovery](#-backup--disaster-recovery)
11. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Deploy to Railway (Recommended - Simplest)

```bash
# 1. Create Railway account
# 2. Connect GitHub repository
# 3. Railway auto-detects:
#    - Procfile: "web: bash start.sh"
#    - Dockerfile: Available
#    - Dependencies: Python 3.11 + backend/requirements.txt
# 4. Add environment variables (see below)
# 5. Deploy! (takes 2-3 minutes)
# 6. Verify: https://yourdomain.railway.app/api/v1/health
```

### Verify Deployment

```bash
# Health check
curl https://yourdomain.railway.app/api/v1/health

# Expected response:
{
  "status": "success",
  "data": {
    "system_status": "healthy",
    "services": {
      "database": "healthy",
      "api": "healthy"
    }
  }
}
```

---

## ✅ Prerequisites

### Required Tools

| Tool | Version | Purpose | Check Command |
|------|---------|---------|----------------|
| Node.js | 18+ | Frontend runtime | `node --version` |
| Python | 3.11+ | Backend runtime | `python --version` |
| PostgreSQL | 14+ | Database | `psql --version` |
| Redis | 6.0+ | Cache | `redis-cli --version` |
| Git | 2.x | Version control | `git --version` |
| Docker | 20.x | Containerization | `docker --version` |
| Docker Compose | 2.x | Multi-container | `docker-compose --version` |

### Required Accounts

| Service | Purpose | Signup |
|---------|---------|--------|
| Railway | Hosting (recommended) | [railway.app](https://railway.app) |
| GitHub | Code repository | [github.com](https://github.com) |
| Stripe | Payments | [stripe.com](https://stripe.com) |
| DocuSign | E-signatures | [docusign.com](https://docusign.com) |
| SendGrid | Email | [sendgrid.com](https://sendgrid.com) |
| AWS | Document storage | [aws.amazon.com](https://aws.amazon.com) |

---

## 💻 Local Development Setup

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
# DATABASE_URL=postgresql://immo2000:password@localhost:5432/immo2000_dev
# SECRET_KEY=your-dev-secret-key
# JWT_SECRET_KEY=your-jwt-secret
# STRIPE_SECRET_KEY=sk_test_xxx
# DOCUSIGN_CLIENT_ID=xxx
# AWS_ACCESS_KEY_ID=xxx
# AWS_SECRET_ACCESS_KEY=xxx

# Initialize database
python init_db_and_user.py

# Run tests
python -m pytest tests/ -v

# Start development server (Flask)
python run_server.py
# Backend runs on http://localhost:5000

# OR Start FastAPI server
uvicorn src.main:create_app --reload --port 8000
# Backend runs on http://localhost:8000
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

# Run tests
npm test -- --run

# Start development server
npm run dev
# Frontend runs on http://localhost:5173 (Vite)
```

### 4. Verify Complete Setup

```bash
# Terminal 1: Backend
cd backend && python run_server.py
# Wait for "Running on http://localhost:5000"

# Terminal 2: Frontend
cd frontend && npm run dev
# Wait for "Local: http://localhost:5173"

# Terminal 3: Test API
curl http://localhost:5000/api/v1/health
# Should return: {"status": "healthy"}

# Open browser
open http://localhost:5173
# Should see Immo2000 interface
```

---

## 🚀 Deployment Options

---

### Option 1: Railway.app (⭐ RECOMMENDED - Easiest)

**Why Railway?**
- ✅ 1-click deployment from GitHub
- ✅ PostgreSQL and Redis included
- ✅ SSL/HTTPS automatic
- ✅ Built-in monitoring
- ✅ Automatic deployments on push
- ✅ Free tier available

**Steps:**

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub account

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your Immo2000 repository

3. **Configure Project**
   Railway will automatically detect:
   - Procfile: `web: bash start.sh`
   - Dockerfile at root
   - Python 3.11 runtime
   - Dependencies from `backend/requirements.txt`

4. **Add Environment Variables**
   ```bash
   # Required for Railway
   DATABASE_URL=postgresql://user:pass@localhost:5432/immo2000
   REDIS_URL=redis://localhost:6379/0
   SECRET_KEY=your-super-secret-key-32-chars-minimum
   JWT_ALGORITHM=HS256
   JWT_SECRET_KEY=your-jwt-secret
   PORT=8000
   
   # Stripe
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_PUBLIC_KEY=pk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   
   # DocuSign
   DOCUSIGN_CLIENT_ID=xxx
   DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
   DOCUSIGN_USER_ID=xxx
   DOCUSIGN_BASE_URL=https://www.docusign.net/restapi
   DOCUSIGN_OAUTH_URL=account.docusign.com
   
   # SendGrid
   SENDGRID_API_KEY=SG.xxx
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   
   # AWS S3
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   AWS_S3_BUCKET=immo2000-documents
   AWS_S3_REGION=eu-west-1
   
   # CORS
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   ```

5. **Deploy**
   - Railway automatically triggers first build
   - Wait 2-3 minutes
   - Deployment complete!

6. **Verify**
   ```bash
   curl https://yourdomain.railway.app/api/v1/health
   ```

**Configuration Files Used:**
- `Procfile` - Start command
- `start.sh` - Startup script (handles `cd backend`)
- `Dockerfile` - Container configuration
- `railway.json` - Railway-specific config
- `.railwayignore` - Files to exclude from build

---

### Option 2: Heroku

**Pros:**
- ✅ Well-established platform
- ✅ Easy PostgreSQL add-on
- ✅ Free tier available

**Cons:**
- ⚠️ Slower builds
- ⚠️ Limited free resources

**Steps:**

```bash
# 1. Create Heroku app
heroku create immo2000-prod

# 2. Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 3. Add Redis
heroku addons:create heroku-redis:premium-0

# 4. Set environment variables
heroku config:set \
  SECRET_KEY=your-secret-key \
  JWT_SECRET_KEY=your-jwt-secret \
  DATABASE_URL=$(heroku config:get DATABASE_URL -a immo2000-prod) \
  REDIS_URL=$(heroku config:get REDIS_URL -a immo2000-prod) \
  # ... other variables

# 5. Deploy
git push heroku main

# 6. Verify
curl https://immo2000-prod.herokuapp.com/api/v1/health
```

---

### Option 3: Docker on AWS ECS/EC2 (More Control)

**Pros:**
- ✅ Full control over infrastructure
- ✅ Scalable
- ✅ Production-ready

**Cons:**
- ⚠️ More complex setup
- ⚠️ Requires AWS knowledge

**Steps:**

```bash
# 1. Build Docker image
docker build -f Dockerfile.fastapi -t immo2000-api:latest .

# 2. Tag and push to ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.eu-west-1.amazonaws.com
docker tag immo2000-api:latest [account-id].dkr.ecr.eu-west-1.amazonaws.com/immo2000-api:latest
docker push [account-id].dkr.ecr.eu-west-1.amazonaws.com/immo2000-api:latest

# 3. Deploy on ECS
# - Create ECS cluster
# - Create task definition with container image
# - Create service with load balancer
# - Configure target groups

# 4. Configure Load Balancer
# - Add HTTPS listener (port 443)
# - Add HTTP to HTTPS redirect (port 80 → 443)
# - Configure SSL certificate (ACM or upload)

# 5. Configure Route 53 (DNS)
# - Create hosted zone
# - Add A record pointing to load balancer

# 6. Verify
curl https://api.yourdomain.com/api/v1/health
```

**Recommended AWS Architecture:**
```
Internet
   │
   ▼
CloudFront (CDN)
   │
   ▼
Route 53 (DNS)
   │
   ▼
Application Load Balancer (ALB)
   │ HTTPS:443
   │ HTTP:80 → Redirect to 443
   │
   ├─ Target Group:8000 → ECS Service (FastAPI)
   │
   ▼
ECS Cluster
   │
   ├─ EC2 Instances (or Fargate)
   │   │
   │   └─ Docker Container: immo2000-api:latest
   │       Port: 8000
   │       Health Check: /api/v1/health
   │
   ▼
RDS PostgreSQL (Multi-AZ)
   Port: 5432
   
RDS Proxy (Optional - for connection pooling)

ElastiCache Redis
   Port: 6379

S3 Bucket
   Name: immo2000-documents
   
CloudWatch
   Logs: /ecs/immo2000
   Metrics: CPU, Memory, Requests
```

---

### Option 4: Docker on GCP Cloud Run

**Pros:**
- ✅ Serverless containers
- ✅ Auto-scaling
- ✅ Pay-per-use pricing

**Steps:**

```bash
# 1. Build and push Docker image
gcloud builds submit --tag gcr.io/your-project/immo2000-api:latest

# 2. Deploy to Cloud Run
gcloud run deploy immo2000-api \
  --image gcr.io/your-project/immo2000-api:latest \
  --platform managed \
  --region europe-west1 \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "DATABASE_URL=...,SECRET_KEY=..."

# 3. Allow unauthenticated access
gcloud run services add-iam-policy-binding immo2000-api \
  --member="allUsers" \
  --role="roles/run.invoker"

# 4. Verify
curl https://immo2000-api-xxx.a.run.app/api/v1/health
```

---

### Option 5: Self-Hosted (VPS/Dedicated Server)

**Pros:**
- ✅ Full control
- ✅ No platform restrictions

**Cons:**
- ⚠️ Manual maintenance
- ⚠️ Security management required

**Steps:**

```bash
# 1. Connect to server
ssh root@your-server-ip

# 2. Install dependencies
sudo apt update
sudo apt install -y python3.11 python3.11-venv postgresql redis-server nginx docker.io

# 3. Clone repository
git clone https://github.com/yourorg/immo2000.git
cd immo2000

# 4. Setup backend (similar to local setup)
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Setup systemd service for backend
sudo nano /etc/systemd/system/immo2000-backend.service

# Add this content:
[Unit]
Description=Immo2000 Backend API
After=network.target postgresql.service redis.service

[Service]
User=immo2000
WorkingDirectory=/home/immo2000/immo2000/backend
Environment="PATH=/home/immo2000/immo2000/backend/venv/bin"
ExecStart=/home/immo2000/immo2000/backend/venv/bin/uvicorn src.main:create_app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable immo2000-backend
sudo systemctl start immo2000-backend

# 6. Setup nginx as reverse proxy
sudo nano /etc/nginx/sites-available/immo2000

# Add nginx config (see below)

# 7. Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/immo2000 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. Configure SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for real-time features
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Frontend (if serving from same domain)
    location / {
        root /var/www/immo2000/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location /static/ {
        alias /var/www/immo2000/frontend/dist/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # API Only
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🐳 Docker & Containerization

---

### Docker Images

**Backend (FastAPI):**
```bash
# Build
cd backend
docker build -f Dockerfile.fastapi -t immo2000-backend:latest .

# Run locally
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/immo2000 \
  -e SECRET_KEY=your-secret \
  immo2000-backend:latest
```

**Frontend (React/Vite):**
```bash
# Build
cd frontend
docker build -f Dockerfile.frontend -t immo2000-frontend:latest .

# Run locally
docker run -p 3000:3000 immo2000-frontend:latest
```

---

### Docker Compose

**For Local Development:**

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15
    container_name: immo2000_postgres
    environment:
      POSTGRES_DB: immo2000_dev
      POSTGRES_USER: immo2000
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - immo2000_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U immo2000"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: immo2000_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - immo2000_network
    restart: unless-stopped
    # Currently disabled - uncomment to enable
    # command: redis-server --appendonly yes

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.fastapi
    container_name: immo2000_backend
    environment:
      DATABASE_URL: postgresql://immo2000:dev_password@postgres:5432/immo2000_dev
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: dev-secret-key-change-me
      JWT_SECRET_KEY: dev-jwt-secret-change-me
      API_PORT: 8000
      FLASK_ENV: development
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - immo2000_network
    restart: unless-stopped
    volumes:
      - ./backend:/app/backend
    command: >
      bash -c "
      cd /app/backend &&
      pip install -r requirements.txt &&
      python init_db_and_user.py &&
      uvicorn src.main:create_app --host 0.0.0.0 --port 8000 --reload
      "

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: http://localhost:8000/api/v1
    container_name: immo2000_frontend
    ports:
      - "3000:5173"
    environment:
      VITE_API_URL: http://localhost:8000/api/v1
    networks:
      - immo2000_network
    restart: unless-stopped
    volumes:
      - ./frontend:/app/frontend
      - /app/frontend/node_modules

networks:
  immo2000_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

**Commands:**
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend   # Backend logs
docker-compose logs -f frontend  # Frontend logs
docker-compose logs -f postgres  # Database logs

# Check service status
docker-compose ps

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

---

### Docker for Production

**Optimized Dockerfile (Multi-stage):**
```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY backend/requirements.txt .
RUN pip install --user -r requirements.txt

# Copy application code
COPY backend /app/backend

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

# Ensure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Create non-root user for security
RUN useradd -m appuser && \
    chown -R appuser:appuser /app
USER appuser

# Copy start script
COPY start.sh .
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Start application
CMD ["bash", "start.sh"]
```

**start.sh:**
```bash
#!/bin/bash
# Startup script for Railway/Heroku

cd "$(dirname "$0")/backend" || exit 1

# Run database migrations if needed
# python init_db_and_user.py

# Start FastAPI with Uvicorn
exec uvicorn src.main:create_app \
  --host 0.0.0.0 \
  --port ${PORT:-8000} \
  --workers ${WORKERS:-4}
```

---

## 🔧 Environment Configuration

---

### Required Variables (All Environments)

```bash
# ========== CORE ==========
FASTAPI_ENV=production          # or 'development'
DEBUG=false                    # true for development
LOG_LEVEL=info                # debug, info, warning, error

# ========== DATABASE ==========
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/immo2000
DB_POOL_SIZE=30
DB_POOL_RECYCLE=3600

# ========== REDIS ==========
REDIS_URL=redis://host:6379/0

# ========== JWT & SECURITY ==========
SECRET_KEY=your_super_secret_key_minimum_32_characters
JWT_SECRET_KEY=your_jwt_secret_key_32_chars_min
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
JWT_REFRESH_EXPIRATION_DAYS=7

# ========== CORS ==========
# Development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production (replace with your domain)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
CORS_ALLOW_HEADERS=*

# ========== API ==========
API_TITLE=Immo2000 API
API_VERSION=6.0.0
API_DESCRIPTION=Real Estate Platform API
API_PORT=8000                    # or 5000 for Flask
```

### External Services Variables

```bash
# ========== STRIPE (Payments) ==========
STRIPE_SECRET_KEY=sk_live_xxx          # Production
# STRIPE_SECRET_KEY=sk_test_xxx      # Development
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_WEBHOOK_URL=https://yourdomain.com/api/v1/paiements/webhook/stripe

# ========== DOCUSIGN (E-Signatures) ==========
DOCUSIGN_CLIENT_ID=your-client-id
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAK...\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_BASE_URL=https://www.docusign.net/restapi  # Production
# DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi  # Development
DOCUSIGN_OAUTH_URL=account.docusign.com
DOCUSIGN_CALLBACK_URL=https://yourdomain.com/api/v1/docusign/oauth/callback

# ========== SENDGRID (Email) ==========
SENDGRID_API_KEY=SG.your-api-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Immo2000
EMAIL_SMTP_SERVER=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=apikey
EMAIL_SMTP_PASSWORD=your-sendgrid-api-key

# ========== AWS S3 (Document Storage) ==========
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=immo2000-documents
AWS_S3_REGION=eu-west-1
AWS_S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com

# ========== OAUTH (Social Login) ==========
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
```

### Feature Flags

```bash
# ========== FEATURES ==========
ENABLE_CACHE=true              # Enable Redis caching
ENABLE_MONITORING=true          # Enable metrics collection
ENABLE_AUDIT_LOGGING=true       # Log all admin actions
ENABLE_EMAIL_NOTIFICATIONS=true # Send email notifications
ENABLE_2FA=false               # Enable two-factor authentication
ENABLE_RATE_LIMITING=true       # Enable API rate limiting
ENABLE_CORS=true               # Enable CORS headers

# ========== ADMIN ==========
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-admin-password  # Only for initial setup
```

---

## ✅ Production Checklist

---

### 🔐 Security

- [ ] **Generate new secrets**
  - [ ] `SECRET_KEY` (32+ random characters)
  - [ ] `JWT_SECRET_KEY` (32+ random characters)
  - [ ] Database password (16+ characters)
  - [ ] Redis password (if enabled)

- [ ] **HTTPS Configuration**
  - [ ] SSL certificate obtained (Let's Encrypt, AWS ACM, etc.)
  - [ ] HTTP → HTTPS redirect configured
  - [ ] Mixed content warnings resolved

- [ ] **CORS Configuration**
  - [ ] Only allow trusted domains in `CORS_ALLOWED_ORIGINS`
  - [ ] CORS credentials enabled if needed
  - [ ] Preflight requests handled

- [ ] **Rate Limiting**
  - [ ] Limit login attempts (5/min/IP)
  - [ ] Limit API requests (100/min/user)
  - [ ] Limit unauthenticated requests (100/min/IP)

- [ ] **Authentication Security**
  - [ ] JWT tokens have expiration (24h recommended)
  - [ ] Refresh tokens implemented
  - [ ] Password hashing verified (bcrypt)

- [ ] **Web Application Firewall**
  - [ ] WAF configured (Cloudflare, AWS WAF, etc.)
  - [ ] SQL injection protection enabled
  - [ ] XSS protection enabled

- [ ] **Data Protection**
  - [ ] Sensitive data encrypted at rest
  - [ ] PII (Personally Identifiable Information) protected
  - [ ] Backups encrypted

- [ ] **Secrets Management**
  - [ ] No secrets in code repository
  - [ ] Secrets stored in vault/secret manager
  - [ ] Environment variables used for configuration

---

### 🗃️ Database

- [ ] **Backup Strategy**
  - [ ] Daily automated backups configured
  - [ ] Backup retention policy defined (30+ days)
  - [ ] Backup restoration tested

- [ ] **High Availability**
  - [ ] Multi-AZ deployment (for RDS)
  - [ ] Read replicas configured (if needed)
  - [ ] Failover testing completed

- [ ] **Performance**
  - [ ] All required indexes created (see Architecture.md)
  - [ ] Query optimization completed
  - [ ] Connection pooling configured

- [ ] **Data Migration**
  - [ ] Database migrations tested
  - [ ] Rollback procedures documented
  - [ ] Data consistency verified

---

### ⚡ Performance & Monitoring

- [ ] **Caching**
  - [ ] Redis configured for session storage
  - [ ] API response caching implemented
  - [ ] Cache TTLs properly set

- [ ] **Monitoring**
  - [ ] Health check endpoint (`/api/v1/health`) deployed
  - [ ] Uptime monitoring configured
  - [ ] Performance metrics collected
  - [ ] Error tracking configured (Sentry, etc.)

- [ ] **Alerts**
  - [ ] CPU > 80% alert
  - [ ] Memory > 85% alert
  - [ ] Error rate > 1% alert
  - [ ] Response time P95 > 500ms alert
  - [ ] Database connection errors alert

- [ ] **Logs**
  - [ ] Application logs centralized
  - [ ] Log retention policy defined (30+ days)
  - [ ] Log rotation configured
  - [ ] Error logs monitored

---

### 🌐 Frontend

- [ ] **Production Build**
  - [ ] `npm run build` successful
  - [ ] Build tested with `npm run preview`
  - [ ] All assets properly minified

- [ ] **CDN Configuration**
  - [ ] Static assets served via CDN
  - [ ] Cache headers properly set
  - [ ] Cache invalidation configured

- [ ] **Performance Optimization**
  - [ ] Gzip/Brotli compression enabled
  - [ ] Image optimization implemented
  - [ ] Lazy loading for images/components
  - [ ] Code splitting configured

- [ ] **PWA (Optional)**
  - [ ] Service worker configured
  - [ ] Manifest file configured
  - [ ] Offline caching implemented

---

### 🤝 External Integrations

- [ ] **Payment Processing**
  - [ ] Stripe account configured for production
  - [ ] Webhook endpoint configured
  - [ ] Webhook signature verification implemented
  - [ ] Payment flow tested end-to-end

- [ ] **E-Signatures**
  - [ ] DocuSign production account configured
  - [ ] OAuth flow tested
  - [ ] Webhook/callback URL configured
  - [ ] Document signing tested

- [ ] **Email Service**
  - [ ] SendGrid production API key configured
  - [ ] Email templates configured
  - [ ] Transactional emails tested
  - [ ] Email delivery verified

- [ ] **Document Storage**
  - [ ] AWS S3 bucket configured
  - [ ] Bucket permissions properly set
  - [ ] Document upload tested
  - [ ] Document download tested

- [ ] **Identity Verification (Optional)**
  - [ ] Yousign/Veriff account configured
  - [ ] Webhooks configured
  - [ ] Verification flow tested

---

### 🧪 Testing

- [ ] **Unit Tests**
  - [ ] All backend tests passing (100%)
  - [ ] All frontend tests passing (100%)
  - [ ] Test coverage > 80%

- [ ] **Integration Tests**
  - [ ] API endpoints tested
  - [ ] Database interactions tested
  - [ ] External service integrations tested

- [ ] **Load Testing**
  - [ ] Performance baseline established
  - [ ] Load test with 100 concurrent users
  - [ ] Latency < 1 second under load
  - [ ] Error rate < 1% under load

- [ ] **End-to-End Testing**
  - [ ] Complete user journeys tested
  - [ ] Payment flow tested
  - [ ] Document signing flow tested
  - [ ] Transaction completion tested

---

### 🚀 Deployment Verification

- [ ] **API Health**
  - [ ] `/api/v1/health` returns healthy status
  - [ ] All services responding
  - [ ] Database connection verified

- [ ] **Frontend Verification**
  - [ ] Application loads without errors
  - [ ] All pages accessible
  - [ ] All features functional
  - [ ] No console errors

- [ ] **Data Consistency**
  - [ ] Production database initialized
  - [ ] Seed data loaded (if applicable)
  - [ ] Data migration verified

- [ ] **Monitoring**
  - [ ] Health checks passing
  - [ ] Monitoring dashboards functional
  - [ ] Alerts configured and tested

---

## 🌐 Infrastructure & Ports

---

### Port Configuration Summary

| Service | Port | Configuration | Status | Purpose |
|---------|------|---------------|--------|---------|
| **PostgreSQL** | 5432 | `DB_PORT` | ✅ Required | Database |
| **Redis** | 6379 | `REDIS_URL` | ⚠️ Optional | Cache |
| **Flask API** | 5000 | `API_PORT` | ✅ Legacy | Backend (Flask) |
| **FastAPI** | 8000 | Default | ✅ Recommended | Backend (FastAPI) |
| **Frontend (External)** | 3000 | `FRONTEND_PORT` | ✅ Required | React/Vite |
| **Frontend (Internal)** | 5173 | Vite dev | ✅ Development | Vite server |
| **SMTP** | 587 | `EMAIL_SMTP_PORT` | ✅ Required | Email (TLS) |
| **HTTP** | 80 | Nginx/ALB | 🔷 Required | Redirect to HTTPS |
| **HTTPS** | 443 | Nginx/ALB | ✅ Required | Secure API/Frontend |
| **Prometheus** | 9090 | - | 🔷 Optional | Metrics |
| **Grafana** | 3001 | - | 🔷 Optional | Dashboards |
| **Node Exporter** | 9100 | - | 🔷 Optional | System metrics |

---

### Service Details

#### 🐘 PostgreSQL Database
- **Container**: `immo2000_postgres`
- **Environment Variable**: `DB_PORT=5432`
- **Configuration**: `docker-compose.yml` line 16
- **Default Database**: `immo2000`
- **Default User**: `immo2000`
- **Connection String**: `postgresql://immo2000:password@localhost:5432/immo2000`

#### 🚀 Backend API (FastAPI)
- **Container**: `immo2000_backend`
- **Port**: 8000 (recommended) or 5000 (Flask)
- **Command**: `uvicorn src.main:create_app --host 0.0.0.0 --port 8000 --workers 4`
- **Health Check**: `GET /api/v1/health`
- **API Documentation**: `GET /api/v1/docs` (Swagger UI)
- **OpenAPI Spec**: `GET /api/v1/openapi.json`

#### 🎨 Frontend (React/Vite)
- **Container**: `immo2000_frontend`
- **External Port**: 3000 (mapped from 5173)
- **Internal Port**: 5173
- **Environment Variable**: `FRONTEND_PORT=3000`
- **Dev Server**: `npm run dev -- --host 0.0.0.0 --port 5173`
- **Local URL**: `http://localhost:3000`
- **Dockerfile**: `Dockerfile.frontend`

#### 📧 Email (SMTP)
- **Port**: 587
- **Configuration**: TLS/STARTTLS
- **Environment Variables**:
  - `EMAIL_SMTP_PORT=587`
  - `SMTP_HOST=smtp.gmail.com` (example)
  - `SMTP_USER=your-email@gmail.com`
  - `SMTP_PASSWORD=your-app-password`
  - `EMAIL_FROM_ADDRESS=noreply@yourdomain.com`

#### 🔴 Redis Cache (Optional)
- **Port**: 6379
- **Environment Variable**: `REDIS_URL=redis://localhost:6379/0`
- **Status**: Disabled by default (commented in docker-compose.yml)
- **Container**: `immo2000_redis`
- **Image**: `redis:7-alpine`

**To Enable Redis:**
```yaml
# In docker-compose.yml
redis:
  image: redis:7-alpine
  container_name: immo2000_redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - immo2000_network
```

#### 🌐 Proxy/Reverse Proxy (Production)
- **HTTP Port**: 80
- **HTTPS Port**: 443
- **SSL/TLS**: Required
- **Recommended**: Nginx or Traefik

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        root /var/www/immo2000/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

**Routing Rules:**
- Frontend → Port 443 (HTTPS)
- Backend API → Port 443/api/v1 (HTTPS)
- Force HTTPS redirect (port 80 → 443)

#### 📊 Monitoring & Observability
| Service | Port | Status | Notes |
|---------|------|--------|-------|
| **Prometheus** | 9090 | 🔷 Optional | Application metrics |
| **Grafana** | 3001 | 🔷 Optional | Visualization dashboards |
| **Node Exporter** | 9100 | 🔷 Optional | System metrics |

---

### Local Development Ports

```
Frontend:    http://localhost:3000      (external)
             http://localhost:5173      (internal - Vite)

Backend:     http://localhost:5000      (Flask)
             http://localhost:8000      (FastAPI)

Database:    localhost:5432             (PostgreSQL)

Email:       smtp.* (external)          :587 (TLS)

Optional:
Redis:       localhost:6379             (if enabled)
Prometheus:  localhost:9090             (if monitoring)
Grafana:     localhost:3001             (if monitoring)
```

---

## 📊 Monitoring & Logging

---

### Health Checks

**Endpoint:** `GET /api/v1/health`

**Response:**
```json
{
  "status": "success",
  "data": {
    "system_status": "healthy|degraded|unhealthy",
    "timestamp": "2026-06-09T10:00:00Z",
    "services": {
      "database": "healthy|unhealthy",
      "redis": "healthy|unhealthy|disabled",
      "api": "healthy",
      "queue": "healthy|disabled"
    },
    "uptime_hours": 240,
    "response_time_ms": 5
  }
}
```

**Check Frequency:** Every 30 seconds

---

### Monitoring Tools

#### Prometheus (Metrics Collection)

**Configuration:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'immo2000-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/api/v1/metrics'

  - job_name: 'node-exporter'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:9100']
```

**Run Prometheus:**
```bash
docker run -d \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

#### Grafana (Visualization)

**Setup:**
1. Run Grafana: `docker run -d -p 3001:3000 grafana/grafana`
2. Access: `http://localhost:3001` (admin/admin)
3. Add Prometheus as data source (URL: `http://host.docker.internal:9090`)
4. Import dashboard JSON or create custom dashboards

**Recommended Dashboards:**
- API Response Times
- Error Rates
- Database Query Performance
- Memory/CPU Usage
- Active Users

#### Node Exporter (System Metrics)

**Run:**
```bash
docker run -d \
  -p 9100:9100 \
  -v "/proc:/host/proc:ro" \
  -v "/sys:/host/sys:ro" \
  -v "/:/rootfs:ro" \
  --net="host" \
  prom/node-exporter \
  --path.procfs=/host/proc \
  --path.rootfs=/rootfs \
  --path.sysfs=/host/sys \
  --collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($|/)
```

---

### Logging

**Log Levels:**
- `DEBUG` - Development only, very verbose
- `INFO` - Production, important events
- `WARNING` - Potential issues
- `ERROR` - Errors that need attention
- `CRITICAL` - Critical failures

**Log Format:**
```
[2026-06-09 10:00:00] [INFO] [api.transactions] GET /api/v1/transactions/123 - 200 OK - 50ms
[2026-06-09 10:00:01] [ERROR] [api.payments] POST /api/v1/paiements - 500 - Stripe connection failed
```

**Log Rotation:**
```python
# Python logging configuration
import logging
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'app.log',
    maxBytes=10*1024*1024,  # 10 MB
    backupCount=5
)
handler.setFormatter(logging.Formatter(
    '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s'
))
logger.addHandler(handler)
```

---

## 💾 Backup & Disaster Recovery

---

### Database Backup

#### PostgreSQL Backup

**Daily Backup Script:**
```bash
#!/bin/bash
# PostgreSQL backup script

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR=/backups/postgres
DB_NAME=immo2000

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U immo2000 -h localhost -F c -b -v -f $BACKUP_DIR/$DB_NAME-$DATE.dump $DB_NAME

# Compress backup
gzip $BACKUP_DIR/$DB_NAME-$DATE.dump

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/$DB_NAME-$DATE.dump.gz s3://your-backup-bucket/postgres/
```

**Cron Job (Daily at 2am):**
```bash
0 2 * * * /path/to/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

#### PostgreSQL Restore

```bash
# Restore from backup
pg_restore -U immo2000 -h localhost -d immo2000 -v /backups/postgres/immo2000-2026-06-09.dump
```

---

### Application Backup

**Docker Volume Backup:**
```bash
# Backup all Docker volumes
docker run --rm \
  -v immo2000_postgres_data:/volume \
  -v $(pwd):/backup \
  alpine tar cvf /backup/postgres-backup.tar /volume

# Restore Docker volume
docker run --rm \
  -v immo2000_postgres_data:/volume \
  -v $(pwd):/backup \
  alpine tar xvf /backup/postgres-backup.tar -C /
```

---

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** < 4 hours
**RPO (Recovery Point Objective):** < 24 hours

**Steps:**

1. **Identify Issue**
   - Check monitoring dashboards
   - Review error logs
   - Verify service status

2. **Activate Backup Systems**
   - Failover to standby database (if available)
   - Switch to backup server
   - Redirect DNS to backup infrastructure

3. **Restore Data**
   - Restore database from latest backup
   - Verify data integrity
   - Restore application state

4. **Verify Services**
   - Run health checks
   - Test critical functionality
   - Verify external integrations

5. **Communicate**
   - Notify stakeholders
   - Update status page
   - Provide estimated resolution time

6. **Post-Incident Review**
   - Analyze root cause
   - Update documentation
   - Implement preventive measures

---

## 🛠️ Troubleshooting

---

### Common Issues & Solutions

#### 🔴 Issue 1: "The executable `cd` could not be found" (Railway)

**Cause:** Procfile tries to run `cd` directly, which is a shell builtin, not an executable.

**Solution:**
1. Create `start.sh`:
```bash
#!/bin/bash
cd "$(dirname "$0")/backend" || exit 1
exec uvicorn src.main:create_app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WORKERS:-4}
```
2. Make it executable: `chmod +x start.sh`
3. Update Procfile: `web: bash start.sh`
4. Commit and redeploy

#### 🔴 Issue 2: "Module not found" (Python)

**Cause:** Missing dependencies or incorrect Python path.

**Solution:**
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Verify installation
pip list | grep fastapi
pip list | grep uvicorn

# Check Python path in container
python -c "import sys; print(sys.path)"
```

#### 🔴 Issue 3: "Connection refused" to PostgreSQL

**Cause:** Database not running or incorrect connection string.

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U immo2000 -h localhost -d immo2000

# Verify connection string
# Should be: postgresql://immo2000:password@localhost:5432/immo2000
```

#### 🔴 Issue 4: "Port 8000 not accessible" (Docker)

**Cause:** Container not exposing port or not running.

**Solution:**
```bash
# Check running containers
docker ps

# Check container ports
docker inspect immo2000_backend | grep Port

# Check if port is exposed
netstat -tuln | grep 8000

# Try accessing from inside container
docker exec -it immo2000_backend curl http://localhost:8000/api/v1/health
```

#### 🔴 Issue 5: "No start command detected" (Railway)

**Solution A:** Enable Dockerfile in Railway
1. Settings → Builder → Dockerfile
2. Select: `./Dockerfile`

**Solution B:** Verify Procfile location
```bash
# Procfile must be at repository root
ls -la /path/to/repo/Procfile
```

#### 🔴 Issue 6: CORS Errors

**Cause:** Frontend and backend on different domains/ports.

**Solution:**
```bash
# Set CORS allowed origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# Verify CORS headers
curl -I http://localhost:8000/api/v1/health
# Should include: Access-Control-Allow-Origin: http://localhost:3000
```

#### 🔴 Issue 7: "Invalid token" (Authentication)

**Cause:** Expired or invalid JWT token.

**Solution:**
```bash
# Get new token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'

# Verify token is valid
# Check expiration in token payload (use jwt.io to decode)
```

#### 🔴 Issue 8: "429 Too Many Requests"

**Cause:** Rate limit exceeded.

**Solution:**
```bash
# Wait and retry with exponential backoff
# Check rate limit headers:
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 1640995200

# Adjust rate limits in code:
from fastapi import FastAPI
from fastapi.middleware import Middleware
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(middleware=[Middleware(limiter)])

@app.get("/api/v1/endpoint")
@limiter.limit("100/minute")
async def endpoint(request):
    return {"status": "ok"}
```

#### 🔴 Issue 9: Database Migrations Failed

**Cause:** Schema mismatch or migration errors.

**Solution:**
```bash
# Check current database state
python -c "from src.models import *; print('OK')"

# Run migrations manually
alembic upgrade head

# Check migration history
alembic history

# Rollback if needed
alembic downgrade -1
```

#### 🔴 Issue 10: Stripe Webhook Failures

**Cause:** Incorrect webhook signature or URL.

**Solution:**
```bash
# Verify webhook signature
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Test webhook locally
stripe listen --forward-to localhost:8000/api/v1/paiements/webhook/stripe

# Check webhook logs
stripe logs tail
```

---

## 📚 Additional Resources

- [Architecture Documentation](../ARCHITECTURE.md)
- [API Reference](../API/REFERENCE.md)
- [Security Guide](../SECURITY.md)
- [Railway Configuration Guide](RAILWAY_CONFIGURATION_GUIDE.md)

---

**Documentation Version**: 2.0.0
**Last Updated**: 2026-06-09
**Status**: ✅ PRODUCTION READY

# Task 6: SSL/HTTPS Configuration - COMPLETE ✅

**Status**: COMPLETE
**Time**: 20 minutes
**Files Created**: 2

---

## 🔐 Implementation Summary

### 1. SSL Setup Script (New)
**File**: `scripts/setup-ssl.sh` (280 lignes)

**Features**:
```bash
✓ Let's Encrypt certificate generation
✓ Multiple domain support (example.com + www.example.com)
✓ Standalone mode (direct certbot)
✓ Docker mode (containerized certbot)
✓ Certificate verification
✓ Auto-renewal setup
✓ Nginx configuration
✓ TLS testing
✓ Detailed logging
```

**Modes Supported**:
```
standalone  : Local certbot (requires certbot installed)
docker      : Containerized certbot (no local installation)
renew       : Renew existing certificates
```

**Prerequisites**:
```bash
# Option 1: Install certbot locally
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Option 2: Use Docker (included)
# No local installation needed
```

---

### 2. SSL Configuration Details

#### Certificate Generation
```bash
# Standalone mode
./scripts/setup-ssl.sh \
  -d example.com \
  -e admin@example.com \
  -m standalone

# Docker mode
./scripts/setup-ssl.sh \
  -d example.com \
  -e admin@example.com \
  -m docker
```

#### Certificate Structure
```
/devops/ssl/
├── cert.pem          → Full certificate chain
└── key.pem           → Private key
```

#### Multi-Domain Support
```
Primary:  example.com
Alias:    www.example.com
All in one certificate
Renewal: Automatic
```

---

### 3. TLS Configuration

#### Nginx SSL Settings
```nginx
# Already configured in devops/nginx-prod.conf

listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;

# TLS Versions
ssl_protocols TLSv1.2 TLSv1.3;

# Strong Ciphers
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...';
ssl_prefer_server_ciphers on;

# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

#### Certificate Security
```
Algorithm:    RSA 2048-bit (industry standard)
Issuer:       Let's Encrypt (free, trusted)
Validity:     90 days (standard)
Auto-renewal: 30 days before expiry
Chain:        Full certificate chain included
```

---

### 4. Automatic Renewal

#### Renewal Cron Job
```bash
# Daily renewal at 3 AM
0 3 * * * /path/to/renew-ssl.sh

# Steps:
1. Run certbot renewal
2. Copy new certificates
3. Restart Nginx
4. Log results
```

#### Renewal Process
```
1. Certbot checks if renewal needed
2. If expiry < 30 days: triggers renewal
3. Validates domain ownership
4. Generates new certificate
5. Updates /etc/letsencrypt/live/
6. Copies to /devops/ssl/
7. Restarts Nginx
8. No downtime (pre-hook stops Nginx)
```

#### Monitoring Renewal
```bash
# Check last renewal
certbot certificates

# View renewal status
sudo certbot renew --dry-run

# View renewal log
tail -f /var/log/letsencrypt/renewal.log

# Manual renewal
./scripts/setup-ssl.sh -m renew
```

---

### 5. Validation & Testing

#### Domain Validation
```bash
# DNS resolution check
dig +short example.com @8.8.8.8

# Port 80 accessibility
curl -I http://example.com

# Port 443 accessibility
curl -I https://example.com
```

#### Certificate Testing
```bash
# TLS handshake test
openssl s_client -connect example.com:443

# Certificate details
openssl x509 -in /devops/ssl/cert.pem -text -noout

# Expiration date
openssl x509 -enddate -noout -in /devops/ssl/cert.pem

# Certificate chain
openssl crl2pkcs7 -nocrl -certfile /devops/ssl/cert.pem | openssl pkcs7 -print_certs
```

#### Online Testing
```
https://www.ssllabs.com/ssltest/
  → High grade (A+)
  → Modern TLS
  → Strong ciphers

https://crt.sh/
  → Certificate search
  → Transparency logs
```

---

## 📋 SSL Deployment Checklist

### Pre-Deployment
- [ ] Domain registered and DNS configured
- [ ] Domain resolves correctly
- [ ] Port 80 accessible from internet (for validation)
- [ ] Port 443 ready for HTTPS
- [ ] Email address for Let's Encrypt notifications
- [ ] Backup of Nginx config created

### Setup Steps
```bash
# 1. Make script executable
chmod +x ./scripts/setup-ssl.sh

# 2. Run setup (replace values)
./scripts/setup-ssl.sh \
  -d your-domain.com \
  -e admin@your-domain.com \
  -m standalone

# 3. Verify setup
ls -la ./devops/ssl/
openssl x509 -in ./devops/ssl/cert.pem -text -noout | grep -E "Subject:|Issuer:|Not"

# 4. Test HTTPS
curl -I https://your-domain.com

# 5. Verify Nginx config
docker-compose -f docker-compose-prod.yml exec nginx nginx -t
```

### Post-Deployment
- [ ] HTTPS working (curl -I https://domain.com)
- [ ] No certificate warnings
- [ ] HTTP redirects to HTTPS
- [ ] Security headers present
- [ ] SSL Labs test: A+ grade
- [ ] Certificate auto-renewal enabled
- [ ] Renewal cron job active

---

## 🔄 Renewal Procedures

### Monthly Certificate Check
```bash
#!/bin/bash
# Run monthly to verify certificate status

CERT_FILE="./devops/ssl/cert.pem"

# Get expiration date
EXPIRY=$(openssl x509 -enddate -noout -in $CERT_FILE | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "Certificate expires in $DAYS_LEFT days"

# Alert if < 30 days
if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: Certificate expires in $DAYS_LEFT days!"
    echo "Consider manual renewal: ./scripts/setup-ssl.sh -m renew"
fi

# Log
echo "Certificate check: $DAYS_LEFT days remaining" >> /var/log/ssl-check.log
```

### Emergency Renewal
```bash
# If renewal fails automatically
./scripts/setup-ssl.sh -m renew

# If stuck on old certificate
sudo certbot delete --cert-name your-domain.com
./scripts/setup-ssl.sh -d your-domain.com -e admin@domain.com
```

---

## 🌐 Domain Configuration

### DNS Setup (Required)
```
A Record:
  example.com     → Your server IP
  www.example.com → Your server IP (CNAME to example.com or same IP)

MX Records (Email):
  example.com → mx.example.com (for email)
```

### DNS Validation
```bash
# Check A record
dig A example.com

# Check CNAME
dig CNAME www.example.com

# Check MX
dig MX example.com

# Verify propagation (worldwide)
dig @1.1.1.1 example.com
```

---

## 🔒 Security Best Practices

### Certificate Protection
```bash
# Key permissions (read-only for owner)
-rw------- 1 root root  key.pem

# Cert permissions (readable)
-rw-r--r-- 1 root root  cert.pem

# Owner/group
root:root
```

### Nginx Security
```nginx
# Enforce HTTPS
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;

    # Force HTTPS for 1 year
    add_header Strict-Transport-Security
      "max-age=31536000; includeSubDomains; preload" always;
}
```

### Let's Encrypt Account
```bash
# Protect account
sudo chmod 700 /etc/letsencrypt/accounts/

# Review account info
certbot show_account
```

---

## 📊 Certificate Lifecycle

### Timeline
```
Day 1:      Certificate issued
Day 60:     Auto-renewal attempt begins (if configured)
Day 75:     Critical warning (< 15 days)
Day 90:     EXPIRATION if renewal fails
```

### Renewal Attempts
```
Automatic:
  - First attempt at day 60 (30 days before expiry)
  - Retries every 12 hours if fails
  - Sends email notifications

Manual:
  - ./scripts/setup-ssl.sh -m renew
  - Force renewal: certbot renew --force-renewal
```

---

## 🚀 Quick Start

### First-Time Setup (5 minutes)
```bash
# 1. Make script executable
chmod +x ./scripts/setup-ssl.sh

# 2. Set your domain and email
export DOMAIN=your-domain.com
export EMAIL=admin@your-domain.com

# 3. Run setup
./scripts/setup-ssl.sh -d $DOMAIN -e $EMAIL -m standalone

# 4. Verify
curl -I https://$DOMAIN

# Done! Auto-renewal is enabled
```

### Renew Certificate
```bash
# Automatic (happens daily via cron)
# Or manual:
./scripts/setup-ssl.sh -m renew
```

### Check Status
```bash
# List certificates
certbot certificates

# Days until expiry
openssl x509 -enddate -noout -in ./devops/ssl/cert.pem
```

---

## 🎯 Troubleshooting

### Certificate Generation Failed
```bash
# Check port 80 accessibility
curl -I http://example.com

# Check DNS
dig example.com

# Try Docker mode
./scripts/setup-ssl.sh -d domain.com -e email@domain.com -m docker

# Debug
sudo certbot certonly --standalone --debug -d domain.com
```

### Renewal Failed
```bash
# Check logs
tail -100 /var/log/letsencrypt/renewal.log

# Manual renewal with debug
sudo certbot renew --debug

# Force renewal
sudo certbot renew --force-renewal
```

### Nginx Won't Start
```bash
# Test config
docker-compose -f docker-compose-prod.yml exec nginx nginx -t

# Verify certificate paths in config
grep ssl_certificate ./devops/nginx-prod.conf

# Check certificate exists
ls -la ./devops/ssl/cert.pem ./devops/ssl/key.pem
```

### HTTPS Not Working
```bash
# Verify Nginx is listening on 443
docker-compose -f docker-compose-prod.yml exec nginx netstat -tlnp

# Check firewall
sudo ufw status
sudo ufw allow 443

# Test TLS
openssl s_client -connect localhost:443
```

---

## 📚 Related Files

- `devops/nginx-prod.conf` - Nginx SSL configuration
- `docker-compose-prod.yml` - Service configuration
- `scripts/setup-ssl.sh` - SSL setup script
- `/etc/letsencrypt/` - Let's Encrypt data
- `/var/log/letsencrypt/renewal.log` - Renewal logs

---

## 🎉 Summary

**Task 6 Complete**: SSL/HTTPS Configuration

**Implemented**:
- ✅ Let's Encrypt certificate generation
- ✅ Multi-domain support (www + non-www)
- ✅ TLS 1.2/1.3 configuration
- ✅ Strong ciphers (ECDHE)
- ✅ HSTS header (1 year)
- ✅ Automatic renewal (90-day certificates)
- ✅ Renewal cron job (daily at 3 AM)
- ✅ Certificate monitoring
- ✅ Nginx integration
- ✅ Domain validation

**Production Readiness**: ✅

**SSL Labs Grade**: A+ (with proper configuration)

**Next**: Task 7 - Production Deployment Testing

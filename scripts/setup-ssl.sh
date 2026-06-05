#!/bin/bash

###############################################################################
# SSL/HTTPS Setup with Let's Encrypt
#
# Configures SSL certificates using certbot and Let's Encrypt
# Handles certificate generation, renewal, and Nginx integration
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
SSL_DIR="${SSL_DIR:-./devops/ssl}"
NGINX_CONF="${NGINX_CONF:-./devops/nginx-prod.conf}"
LOG_FILE="ssl-setup-$(date +%Y%m%d_%H%M%S).log"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
RENEW_BEFORE_DAYS=30

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

step() {
    echo -e "\n${BLUE}===== $1 =====${NC}" | tee -a "$LOG_FILE"
}

usage() {
    cat << EOF
Usage: $0 [options]

Options:
    -d, --domain DOMAIN         Domain name (e.g., example.com, www.example.com)
    -e, --email EMAIL          Email for Let's Encrypt notifications
    -m, --mode [standalone|docker|renew]
                               Setup mode:
                               - standalone: Local certbot setup
                               - docker: Use Docker certbot
                               - renew: Renew existing certificates
    -h, --help                 Show this help message

Examples:
    # Setup new certificate
    $0 -d example.com -e admin@example.com -m standalone

    # Renew existing certificates
    $0 -m renew

    # Docker-based setup
    $0 -d example.com -e admin@example.com -m docker

Environment Variables:
    DOMAIN              Domain name
    EMAIL              Email address
    SSL_DIR            SSL certificates directory (default: ./devops/ssl)
    NGINX_CONF         Nginx configuration file (default: ./devops/nginx-prod.conf)
EOF
    exit 0
}

check_prerequisites() {
    step "Checking Prerequisites"

    if [ "$MODE" != "renew" ]; then
        if [ -z "$DOMAIN" ]; then
            error "Domain name required. Use -d or --domain"
        fi

        if [ -z "$EMAIL" ]; then
            error "Email required. Use -e or --email"
        fi

        log "Domain: $DOMAIN"
        log "Email: $EMAIL"
    fi

    # Check certbot
    if command -v certbot &> /dev/null; then
        log "certbot found: $(certbot --version)"
    elif [ "$MODE" != "docker" ]; then
        error "certbot not found. Install with: sudo apt-get install certbot python3-certbot-nginx"
    fi

    # Create SSL directory
    if [ ! -d "$SSL_DIR" ]; then
        log "Creating SSL directory: $SSL_DIR"
        mkdir -p "$SSL_DIR"
    fi

    log "Prerequisites OK"
}

validate_domain() {
    step "Validating Domain"

    log "Checking DNS resolution for $DOMAIN..."

    if dig +short "$DOMAIN" @8.8.8.8 | grep -q .; then
        log "✓ Domain $DOMAIN resolves correctly"
    else
        error "Cannot resolve domain: $DOMAIN"
        error "Ensure domain DNS is configured and accessible from internet"
    fi

    # Check if port 80 is accessible
    log "Checking port 80 accessibility..."
    if curl -s -I http://"$DOMAIN" > /dev/null 2>&1 || \
       curl -s -I http://www."$DOMAIN" > /dev/null 2>&1; then
        log "✓ Port 80 is accessible"
    else
        warning "Port 80 may not be accessible from internet"
        warning "Let's Encrypt validation may fail"
    fi
}

setup_ssl_standalone() {
    step "Setting Up SSL with Standalone Mode"

    log "Starting certbot for domain: $DOMAIN"
    log "This will validate domain ownership and generate certificates"

    # Generate certificate
    sudo certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN" \
        --domains "www.$DOMAIN" \
        2>&1 | tee -a "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "✓ Certificate generated successfully"
    else
        error "Certificate generation failed"
    fi
}

setup_ssl_docker() {
    step "Setting Up SSL with Docker"

    log "Using Docker certbot image..."

    docker run -it --rm \
        -v "$SSL_DIR:/etc/letsencrypt" \
        -v /var/lib/letsencrypt:/var/lib/letsencrypt \
        -p 80:80 \
        -p 443:443 \
        certbot/certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        2>&1 | tee -a "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "✓ Certificate generated successfully"
    else
        error "Certificate generation failed"
    fi
}

copy_certificates() {
    step "Copying Certificates to SSL Directory"

    CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

    if [ ! -d "$CERT_PATH" ]; then
        error "Certificate path not found: $CERT_PATH"
    fi

    log "Copying certificate files..."
    sudo cp "$CERT_PATH/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "$CERT_PATH/privkey.pem" "$SSL_DIR/key.pem"
    sudo chown "$USER:$USER" "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
    sudo chmod 644 "$SSL_DIR/cert.pem"
    sudo chmod 600 "$SSL_DIR/key.pem"

    log "✓ Certificates copied to $SSL_DIR"
    log "Cert: $SSL_DIR/cert.pem"
    log "Key:  $SSL_DIR/key.pem"
}

verify_certificates() {
    step "Verifying Certificates"

    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        error "Certificate files not found"
    fi

    log "Certificate info:"
    openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | \
        grep -E "Subject:|Issuer:|Not Before|Not After" | tee -a "$LOG_FILE"

    # Get expiration date
    EXPIRY=$(openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" | cut -d= -f2)
    log "Certificate expires: $EXPIRY"

    # Calculate days until expiry
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    log "Days until expiry: $DAYS_LEFT"

    if [ $DAYS_LEFT -lt 0 ]; then
        error "Certificate has expired!"
    elif [ $DAYS_LEFT -lt 30 ]; then
        warning "Certificate expires soon (< 30 days)"
    else
        log "✓ Certificate is valid"
    fi
}

setup_auto_renewal() {
    step "Setting Up Automatic Renewal"

    log "Creating renewal cron job..."

    # Create renewal script
    cat > /tmp/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
if [ $? -eq 0 ]; then
    # Copy certificates
    cp /etc/letsencrypt/live/*/fullchain.pem ./devops/ssl/cert.pem
    cp /etc/letsencrypt/live/*/privkey.pem ./devops/ssl/key.pem

    # Restart Nginx
    docker-compose -f docker-compose-prod.yml restart nginx
fi
EOF

    chmod +x /tmp/renew-ssl.sh

    # Add cron job
    if ! sudo crontab -l | grep -q "renew-ssl.sh"; then
        (sudo crontab -l 2>/dev/null; echo "0 3 * * * /tmp/renew-ssl.sh") | \
            sudo crontab -
        log "✓ Renewal cron job added (daily at 3 AM)"
    else
        log "✓ Renewal cron job already exists"
    fi
}

setup_nginx_ssl() {
    step "Configuring Nginx for HTTPS"

    # Backup original config
    if [ -f "$NGINX_CONF" ]; then
        cp "$NGINX_CONF" "$NGINX_CONF.backup"
        log "Backup created: $NGINX_CONF.backup"
    fi

    log "Updating Nginx configuration..."

    # Check if cert paths are in config
    if ! grep -q "ssl_certificate.*cert.pem" "$NGINX_CONF"; then
        # Add SSL configuration
        sed -i "/listen 443 ssl;/a\\
    ssl_certificate /etc/nginx/ssl/cert.pem;\\
    ssl_certificate_key /etc/nginx/ssl/key.pem;\\
    ssl_protocols TLSv1.2 TLSv1.3;\\
    ssl_ciphers HIGH:!aNULL:!MD5;\\
    ssl_prefer_server_ciphers on;" "$NGINX_CONF"

        log "✓ SSL configuration added to Nginx"
    else
        log "✓ SSL already configured in Nginx"
    fi
}

test_ssl_configuration() {
    step "Testing SSL Configuration"

    if [ -z "$DOMAIN" ]; then
        warning "Cannot test without domain name"
        return
    fi

    log "Testing HTTPS connection..."

    if command -v curl &> /dev/null; then
        # Give Nginx time to restart
        sleep 3

        if curl -I "https://$DOMAIN" 2>/dev/null | head -1; then
            log "✓ HTTPS connection successful"
        else
            warning "HTTPS connection test failed (domain may not be publicly accessible)"
        fi
    fi

    # Test with openssl
    log "Testing TLS with openssl..."
    echo | openssl s_client -connect "$DOMAIN:443" 2>/dev/null | \
        grep -E "subject=|issuer=|Verify return code" | tee -a "$LOG_FILE"
}

renew_certificates() {
    step "Renewing Certificates"

    log "Running certbot renewal..."

    if command -v certbot &> /dev/null; then
        sudo certbot renew \
            --quiet \
            --pre-hook "docker-compose -f docker-compose-prod.yml stop nginx" \
            --post-hook "docker-compose -f docker-compose-prod.yml start nginx"

        if [ $? -eq 0 ]; then
            log "✓ Certificates renewed successfully"

            # Copy to our directory
            LIVE_DIR="/etc/letsencrypt/live/$(ls /etc/letsencrypt/live/ | head -1)"
            sudo cp "$LIVE_DIR/fullchain.pem" "$SSL_DIR/cert.pem"
            sudo cp "$LIVE_DIR/privkey.pem" "$SSL_DIR/key.pem"

            log "✓ Certificates copied to $SSL_DIR"
        else
            error "Certificate renewal failed"
        fi
    else
        error "certbot not found"
    fi
}

generate_report() {
    step "SSL Configuration Report"

    local report_file="ssl-report-$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "SSL/HTTPS Configuration Report"
        echo "Generated: $(date)"
        echo ""
        echo "Configuration:"
        echo "  Domain: $DOMAIN"
        echo "  SSL Directory: $SSL_DIR"
        echo "  Nginx Config: $NGINX_CONF"
        echo ""
        echo "Certificate Status:"

        if [ -f "$SSL_DIR/cert.pem" ]; then
            openssl x509 -in "$SSL_DIR/cert.pem" -text -noout
        else
            echo "  No certificate found"
        fi

        echo ""
        echo "Recent Log Entries:"
        tail -30 "$LOG_FILE"
    } > "$report_file"

    log "Report saved: $report_file"
}

# Parse arguments
MODE="standalone"
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain) DOMAIN="$2"; shift 2 ;;
        -e|--email) EMAIL="$2"; shift 2 ;;
        -m|--mode) MODE="$2"; shift 2 ;;
        -h|--help) usage ;;
        *) error "Unknown option: $1" ;;
    esac
done

# Main execution
main() {
    log "================================"
    log "SSL/HTTPS Setup with Let's Encrypt"
    log "================================"
    log "Mode: $MODE"
    log "Log: $LOG_FILE"

    case "$MODE" in
        standalone|docker)
            check_prerequisites

            if [ "$MODE" = "standalone" ]; then
                validate_domain
                setup_ssl_standalone
            else
                setup_ssl_docker
            fi

            copy_certificates
            verify_certificates
            setup_auto_renewal
            setup_nginx_ssl
            test_ssl_configuration
            generate_report

            log ""
            log "✓ SSL SETUP COMPLETE"
            log "Domain: $DOMAIN"
            log "Certificates: $SSL_DIR"
            log "Auto-renewal: Enabled (daily)"
            ;;

        renew)
            check_prerequisites
            renew_certificates
            verify_certificates
            ;;

        *)
            error "Unknown mode: $MODE"
            ;;
    esac
}

main

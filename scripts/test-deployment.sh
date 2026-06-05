#!/bin/bash

###############################################################################
# Production Deployment Testing
#
# Comprehensive testing suite for validating production deployment
# Tests all services, endpoints, performance, and failover scenarios
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TEST_LOG="deployment-test-$(date +%Y%m%d_%H%M%S).log"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose-prod.yml}"
API_BASE_URL="${API_BASE_URL:-http://localhost:5000}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost}"
TEST_TIMEOUT=5
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$TEST_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$TEST_LOG"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$TEST_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$TEST_LOG"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$TEST_LOG"
}

step() {
    echo -e "\n${BLUE}========== $1 ==========${NC}" | tee -a "$TEST_LOG"
}

test_result() {
    local test_name=$1
    local result=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" -eq 0 ]; then
        success "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        error "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Tests
test_docker_running() {
    step "Testing Docker Services"
    
    # Check if docker-compose is running
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        success "Docker services running"
        test_result "Docker services" 0
    else
        error "Docker services not running"
        test_result "Docker services" 1
    fi
}

test_services_healthy() {
    step "Testing Service Health"
    
    local services=("postgres" "redis" "backend" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up"; then
            success "Service '$service' is healthy"
            test_result "Service health: $service" 0
        else
            error "Service '$service' is not healthy"
            test_result "Service health: $service" 1
        fi
    done
}

test_api_endpoints() {
    step "Testing API Endpoints"
    
    local endpoints=(
        "GET /api/health"
        "GET /api/annonces"
        "GET /api/v1/analytics/health"
        "GET /api/v1/analytics/performance"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local method=$(echo $endpoint | cut -d' ' -f1)
        local path=$(echo $endpoint | cut -d' ' -f2)
        
        local response=$(curl -s -X "$method" \
            -w "\n%{http_code}" \
            --max-time $TEST_TIMEOUT \
            "$API_BASE_URL$path" 2>/dev/null || echo -e "\n000")
        
        local status_code=$(echo "$response" | tail -1)
        
        if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 400 ]; then
            success "API endpoint: $endpoint ($status_code)"
            test_result "Endpoint: $path" 0
        else
            error "API endpoint: $endpoint (Status: $status_code)"
            test_result "Endpoint: $path" 1
        fi
    done
}

test_web_frontend() {
    step "Testing Web Frontend"
    
    local response=$(curl -s -w "\n%{http_code}" \
        --max-time $TEST_TIMEOUT \
        "$WEB_BASE_URL/" 2>/dev/null || echo -e "\n000")
    
    local status_code=$(echo "$response" | tail -1)
    local html=$(echo "$response" | head -1)
    
    if [ "$status_code" = "200" ] && echo "$html" | grep -q -i "html\|react"; then
        success "Web frontend is responding"
        test_result "Web frontend" 0
    else
        error "Web frontend not responding (Status: $status_code)"
        test_result "Web frontend" 1
    fi
}

test_database_connection() {
    step "Testing Database Connection"
    
    local postgres_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q postgres)
    
    if [ -z "$postgres_container" ]; then
        error "PostgreSQL container not found"
        test_result "Database connection" 1
        return
    fi
    
    # Test connection
    if docker exec "$postgres_container" pg_isready -U immobilier > /dev/null 2>&1; then
        success "Database connection successful"
        test_result "Database connection" 0
        
        # Count tables
        local table_count=$(docker exec "$postgres_container" psql -U immobilier immo2000_db \
            -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tail -1)
        
        if [ "$table_count" -gt 0 ]; then
            success "Database has $table_count tables"
            test_result "Database tables" 0
        else
            error "No tables found in database"
            test_result "Database tables" 1
        fi
    else
        error "Cannot connect to database"
        test_result "Database connection" 1
    fi
}

test_redis_connection() {
    step "Testing Redis Connection"
    
    local redis_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)
    
    if [ -z "$redis_container" ]; then
        error "Redis container not found"
        test_result "Redis connection" 1
        return
    fi
    
    # Test connection
    if docker exec "$redis_container" redis-cli ping > /dev/null 2>&1; then
        success "Redis connection successful"
        test_result "Redis connection" 0
        
        # Get info
        local memory=$(docker exec "$redis_container" redis-cli info memory | grep used_memory_human | cut -d: -f2)
        success "Redis memory usage: $memory"
        test_result "Redis memory" 0
    else
        error "Cannot connect to Redis"
        test_result "Redis connection" 1
    fi
}

test_caching() {
    step "Testing Caching System"
    
    # Test cache SET/GET
    local redis_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)
    
    docker exec "$redis_container" redis-cli SET test-key "test-value" > /dev/null
    local value=$(docker exec "$redis_container" redis-cli GET test-key)
    docker exec "$redis_container" redis-cli DEL test-key > /dev/null
    
    if [ "$value" = "test-value" ]; then
        success "Cache SET/GET working"
        test_result "Cache operations" 0
    else
        error "Cache operations failed"
        test_result "Cache operations" 1
    fi
}

test_performance() {
    step "Testing Performance Metrics"
    
    # Test API response time
    local start_time=$(date +%s%N)
    curl -s "$API_BASE_URL/api/health" > /dev/null
    local end_time=$(date +%s%N)
    
    local duration_ms=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$duration_ms" -lt 1000 ]; then
        success "API response time: ${duration_ms}ms (< 1000ms)"
        test_result "Performance: API response" 0
    else
        warning "API response time: ${duration_ms}ms (> 1000ms)"
        test_result "Performance: API response" 1
    fi
}

test_security_headers() {
    step "Testing Security Headers"
    
    local headers=$(curl -s -I "$WEB_BASE_URL/" 2>/dev/null | grep -E "X-Frame|X-Content|Strict-Transport" || true)
    
    if echo "$headers" | grep -q "X-Frame-Options"; then
        success "Security header: X-Frame-Options present"
        test_result "Security: X-Frame-Options" 0
    else
        warning "Security header: X-Frame-Options missing"
        test_result "Security: X-Frame-Options" 1
    fi
    
    if echo "$headers" | grep -q "X-Content-Type-Options"; then
        success "Security header: X-Content-Type-Options present"
        test_result "Security: X-Content-Type-Options" 0
    else
        warning "Security header: X-Content-Type-Options missing"
        test_result "Security: X-Content-Type-Options" 1
    fi
}

test_ssl_https() {
    step "Testing HTTPS/SSL"
    
    # Only test if HTTPS is configured
    if [ ! -f "./devops/ssl/cert.pem" ]; then
        warning "HTTPS not configured (certificate not found)"
        test_result "HTTPS configuration" 1
        return
    fi
    
    # Test certificate validity
    local expiry=$(openssl x509 -enddate -noout -in ./devops/ssl/cert.pem | cut -d= -f2)
    success "Certificate expiry: $expiry"
    
    # Check HTTPS connection
    if curl -s https://localhost --insecure > /dev/null 2>&1; then
        success "HTTPS connection working"
        test_result "HTTPS connection" 0
    else
        warning "HTTPS not accessible (may not be configured)"
        test_result "HTTPS connection" 1
    fi
}

test_logging() {
    step "Testing Logging"
    
    local backend_logs=$(docker-compose -f "$DOCKER_COMPOSE_FILE" logs backend 2>&1 | grep -c "ERROR\|Traceback" || true)
    
    if [ "$backend_logs" -eq 0 ]; then
        success "No errors in backend logs"
        test_result "Backend logging" 0
    else
        warning "$backend_logs errors found in backend logs"
        test_result "Backend logging" 1
    fi
}

test_monitoring() {
    step "Testing Monitoring Stack"
    
    # Check Prometheus
    if curl -s http://localhost:9090/api/v1/status/config > /dev/null 2>&1; then
        success "Prometheus is running"
        test_result "Prometheus" 0
    else
        warning "Prometheus not accessible"
        test_result "Prometheus" 1
    fi
}

test_failover() {
    step "Testing Failover Scenarios"
    
    # Test: API accessible with one backend down (if multiple backends)
    log "Failover test: Checking redundancy..."
    
    # Simulate restart
    info "Restarting backend service..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" restart backend > /dev/null 2>&1
    
    # Wait for restart
    sleep 5
    
    # Test if service recovered
    if curl -s "$API_BASE_URL/api/health" > /dev/null 2>&1; then
        success "Service recovered after restart"
        test_result "Service failover" 0
    else
        error "Service did not recover after restart"
        test_result "Service failover" 1
    fi
}

test_data_integrity() {
    step "Testing Data Integrity"
    
    local postgres_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q postgres)
    
    # Check for corruption
    local integrity=$(docker exec "$postgres_container" \
        pg_dump -U immobilier immo2000_db 2>&1 | \
        grep -c "ERROR" || true)
    
    if [ "$integrity" -eq 0 ]; then
        success "Database integrity OK"
        test_result "Data integrity" 0
    else
        error "Database integrity issues found"
        test_result "Data integrity" 1
    fi
}

generate_test_report() {
    step "Generating Test Report"
    
    local pass_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    
    {
        echo "Production Deployment Test Report"
        echo "=================================="
        echo "Generated: $(date)"
        echo ""
        echo "Test Summary:"
        echo "  Total Tests:   $TOTAL_TESTS"
        echo "  Passed:        $PASSED_TESTS"
        echo "  Failed:        $FAILED_TESTS"
        echo "  Pass Rate:     ${pass_rate}%"
        echo ""
        echo "Test Details:"
        grep "^\[" "$TEST_LOG" | head -50
    } > "test-report-$(date +%Y%m%d_%H%M%S).txt"
    
    log "Test report generated"
}

# Main execution
main() {
    log "================================"
    log "PRODUCTION DEPLOYMENT TEST SUITE"
    log "================================"
    log "API URL: $API_BASE_URL"
    log "Web URL: $WEB_BASE_URL"
    log "Log file: $TEST_LOG"
    
    # Run all tests
    test_docker_running
    test_services_healthy
    test_database_connection
    test_redis_connection
    test_caching
    test_api_endpoints
    test_web_frontend
    test_performance
    test_security_headers
    test_ssl_https
    test_logging
    test_monitoring
    test_failover
    test_data_integrity
    
    # Generate report
    generate_test_report
    
    # Summary
    step "Test Summary"
    
    local pass_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    
    log "Total Tests:  $TOTAL_TESTS"
    log "Passed:       $PASSED_TESTS"
    log "Failed:       $FAILED_TESTS"
    log "Pass Rate:    ${pass_rate}%"
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        success "ALL TESTS PASSED - READY FOR PRODUCTION"
        return 0
    else
        error "SOME TESTS FAILED - REVIEW REQUIRED"
        return 1
    fi
}

# Run
main

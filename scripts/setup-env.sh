#!/bin/bash
#
# Immo2000 Environment Setup Script for Production
# Sets up all necessary environment variables and configuration files
#

set -e

ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"

echo "=== Immo2000 Environment Setup ==="
echo "Environment: $ENVIRONMENT"
echo ""

# Check if example file exists
if [ ! -f ".env.${ENVIRONMENT}.example" ]; then
    echo "Error: .env.${ENVIRONMENT}.example not found"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE from example..."
    cp ".env.${ENVIRONMENT}.example" "$ENV_FILE"
    echo "✓ Created $ENV_FILE"
    echo ""
    echo "⚠ IMPORTANT: Edit $ENV_FILE and set all required values!"
    echo ""
    read -p "Press enter to continue after editing .env file..."
else
    echo "✓ $ENV_FILE already exists"
fi

# Validate required environment variables
echo ""
echo "Validating environment variables..."

REQUIRED_VARS=(
    "DATABASE_USER"
    "DATABASE_PASSWORD"
    "SECRET_KEY"
    "JWT_SECRET"
    "ALLOWED_HOSTS"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" "$ENV_FILE"; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "✗ Missing required variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Generate secret keys if using placeholders
echo "Checking for placeholder values..."

if grep -q "CHANGE_THIS" "$ENV_FILE"; then
    echo "⚠ Found placeholder values. Generating secure values..."

    # Generate SECRET_KEY
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" "$ENV_FILE"
    echo "✓ Generated SECRET_KEY"

    # Generate JWT_SECRET
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
    echo "✓ Generated JWT_SECRET"
fi

echo "✓ Environment variables validated"
echo ""

# Create necessary directories
echo "Creating required directories..."
mkdir -p ./logs
mkdir -p ./backups
mkdir -p ./devops/ssl
mkdir -p ./data/{postgres,redis}
echo "✓ Directories created"

# Set proper permissions
echo "Setting file permissions..."
chmod 600 "$ENV_FILE"
chmod 755 ./scripts/*.sh
chmod 755 ./logs
chmod 755 ./backups
echo "✓ Permissions set"

# Display summary
echo ""
echo "=== Environment Setup Complete ==="
echo "Environment file: $ENV_FILE"
echo "Configuration: Ready for deployment"
echo ""
echo "Next steps:"
echo "1. Configure SSL certificates in ./devops/ssl/"
echo "2. Update nginx configuration if needed"
echo "3. Run deployment: ./scripts/deploy.sh production"
echo ""

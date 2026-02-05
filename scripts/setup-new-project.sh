#!/bin/bash

# StackScope Project Setup Script
# This script helps configure StackScope for a new project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              StackScope Project Setup                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if config.env already exists
if [ -f "$PROJECT_ROOT/config.env" ]; then
    echo -e "${YELLOW}Warning: config.env already exists.${NC}"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy template
cp "$PROJECT_ROOT/config.env.example" "$PROJECT_ROOT/config.env"
echo -e "${GREEN}✓ Created config.env from template${NC}"

# Gather configuration
echo ""
echo -e "${BLUE}Enter your project configuration:${NC}"
echo ""

# Worker name
read -p "Worker name (e.g., my-project-logs): " worker_name
worker_name=${worker_name:-"stackscope-worker"}

# Cloudflare Account ID
echo ""
echo -e "${YELLOW}Find your Cloudflare Account ID at:${NC}"
echo "  https://dash.cloudflare.com/ -> Overview (right sidebar)"
read -p "Cloudflare Account ID: " cf_account_id

# GitHub repo
echo ""
read -p "GitHub repository (format: owner/repo): " github_repo

# Update config.env
sed -i.bak "s/WORKER_NAME=\".*\"/WORKER_NAME=\"$worker_name\"/" "$PROJECT_ROOT/config.env"
sed -i.bak "s/CLOUDFLARE_ACCOUNT_ID=\".*\"/CLOUDFLARE_ACCOUNT_ID=\"$cf_account_id\"/" "$PROJECT_ROOT/config.env"
sed -i.bak "s/GITHUB_REPO=\".*\"/GITHUB_REPO=\"$github_repo\"/" "$PROJECT_ROOT/config.env"

# Clean up backup files
rm -f "$PROJECT_ROOT/config.env.bak"

echo ""
echo -e "${GREEN}✓ Configuration saved to config.env${NC}"

# Update wrangler.toml
echo ""
echo -e "${BLUE}Updating wrangler.toml...${NC}"

WRANGLER_FILE="$PROJECT_ROOT/worker/wrangler.toml"
if [ -f "$WRANGLER_FILE" ]; then
    sed -i.bak "s/name = \".*\"/name = \"$worker_name\"/" "$WRANGLER_FILE"
    sed -i.bak "s/account_id = \".*\"/account_id = \"$cf_account_id\"/" "$WRANGLER_FILE" 2>/dev/null || true
    rm -f "$WRANGLER_FILE.bak"
    echo -e "${GREEN}✓ Updated wrangler.toml${NC}"
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"
echo -e "${GREEN}✓ Created logs directory${NC}"

# Check if wrangler is installed
echo ""
if command -v wrangler &> /dev/null; then
    echo -e "${GREEN}✓ Wrangler CLI is installed${NC}"

    # Check if logged in
    if wrangler whoami &> /dev/null; then
        echo -e "${GREEN}✓ Already logged in to Cloudflare${NC}"
    else
        echo -e "${YELLOW}Not logged in to Cloudflare${NC}"
        read -p "Do you want to login now? (Y/n): " do_login
        if [[ ! "$do_login" =~ ^[Nn]$ ]]; then
            wrangler login
        fi
    fi
else
    echo -e "${YELLOW}⚠ Wrangler CLI not installed${NC}"
    echo "  Install with: npm install -g wrangler"
fi

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Deploy the worker:"
echo -e "     ${YELLOW}npm run worker:deploy${NC}"
echo ""
echo "  2. Set GitHub webhook secret:"
echo -e "     ${YELLOW}cd worker && wrangler secret put GITHUB_WEBHOOK_SECRET${NC}"
echo ""
echo "  3. Configure GitHub webhook at:"
echo "     https://github.com/$github_repo/settings/hooks"
echo "     - Payload URL: https://$worker_name.YOUR-SUBDOMAIN.workers.dev/webhook/github"
echo "     - Content type: application/json"
echo "     - Secret: (same as GITHUB_WEBHOOK_SECRET)"
echo ""
echo "  4. Start log collection:"
echo -e "     ${YELLOW}npm start${NC}"
echo ""
echo "  5. In your web app, install the SDK:"
echo -e "     ${YELLOW}npm install github:JRGCr/StackScope${NC}"
echo ""
echo "  6. Initialize the SDK:"
echo -e "     ${YELLOW}import { init } from 'stackscope-sdk';${NC}"
echo -e "     ${YELLOW}init({ endpoint: 'https://$worker_name.YOUR-SUBDOMAIN.workers.dev/webhook/browser' });${NC}"
echo ""

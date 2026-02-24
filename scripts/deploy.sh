#!/usr/bin/env bash
# deploy.sh — Set up the Reference Checker API on an Ubuntu ARM server.
#
# Usage:
#   1. SSH into your Oracle Cloud instance
#   2. Clone the repo: git clone https://github.com/jenniferkleiman/referencechecker.git ~/referencechecker
#   3. Run: bash ~/referencechecker/scripts/deploy.sh
#
# Prerequisites:
#   - Ubuntu 24.04 ARM (Oracle Cloud Always Free VM.Standard.A1.Flex)
#   - SSH access as the ubuntu user
#   - .env.production file placed at ~/referencechecker/.env.production with:
#       PORT=3001
#       GEMINI_API_KEY=...
#       SUPABASE_URL=...
#       SUPABASE_SERVICE_ROLE_KEY=...
#       STRIPE_SECRET_KEY=...
#       STRIPE_WEBHOOK_SECRET=...
#       STRIPE_PRICE_STARTER=price_...
#       STRIPE_PRICE_STANDARD=price_...
#       STRIPE_PRICE_BULK=price_...
#       CORS_ORIGIN=https://jenkleiman.com

set -euo pipefail

APP_DIR="$HOME/referencechecker"

echo "=== Reference Checker API — Server Setup ==="

# ── 1. System packages ──────────────────────────────────────────
echo ""
echo "[1/5] Installing system packages..."
sudo apt update
sudo apt install -y git caddy

# Install Node.js 22 LTS if not present
if ! command -v node &> /dev/null || [[ "$(node -v)" != v22* ]]; then
    echo "  Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "  Node $(node -v), npm $(npm -v)"

# ── 2. Install dependencies ─────────────────────────────────────
echo ""
echo "[2/5] Installing npm dependencies..."
cd "$APP_DIR"
npm ci --production=false

# ── 3. Verify .env.production ───────────────────────────────────
echo ""
echo "[3/5] Checking production config..."

ENV_FILE="$APP_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo "  ERROR: $ENV_FILE not found!"
    echo "  Create it with the required environment variables."
    echo "  See .env.example for the template."
    exit 1
fi

for key in GEMINI_API_KEY SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
    if ! grep -q "^${key}=" "$ENV_FILE"; then
        echo "  WARNING: $key not found in $ENV_FILE"
    fi
done
echo "  Config looks good."

# ── 4. Build TypeScript ──────────────────────────────────────────
echo ""
echo "[4/5] Building TypeScript..."
cd "$APP_DIR"
npx tsc

# Copy .env.production for the running service
cp "$ENV_FILE" "$APP_DIR/.env"

# ── 5. Install systemd service ──────────────────────────────────
echo ""
echo "[5/5] Setting up systemd service..."
sudo cp "$APP_DIR/scripts/refcheck.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable refcheck
sudo systemctl restart refcheck

echo "  Service started. Check status: sudo systemctl status refcheck"
echo "  View logs: journalctl -u refcheck -f"

# ── 6. Configure Caddy ─────────────────────────────────────────
echo ""
echo "[6/6] Setting up Caddy reverse proxy..."

# Append to existing Caddyfile if domain not already configured
CADDY_FILE="/etc/caddy/Caddyfile"
if ! grep -q "refcheck-api.jenkleiman.com" "$CADDY_FILE" 2>/dev/null; then
    echo "  Adding refcheck-api config to Caddyfile..."
    sudo bash -c "cat '$APP_DIR/scripts/Caddyfile' >> '$CADDY_FILE'"
    sudo systemctl reload caddy
    echo "  Caddy configured and reloaded."
else
    echo "  Caddy config for refcheck-api already exists, skipping."
fi

# ── Done ────────────────────────────────────────────────────────
echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Point refcheck-api.jenkleiman.com A record to this server's public IP"
echo "  2. Verify: curl https://refcheck-api.jenkleiman.com/api/health"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status refcheck           # App status"
echo "  journalctl -u refcheck -f                # App logs"
echo "  sudo systemctl restart refcheck          # Restart app"

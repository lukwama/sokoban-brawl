#!/usr/bin/env bash
# Deploy sokoban-brawl to this host with nginx + certbot HTTPS for sokoban.lukwama.com
# Run on the server as root or sudo. Requires DNS for sokoban.lukwama.com → this host.
set -e

DOMAIN="${DOMAIN:-sokoban.lukwama.com}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo or as root."
  exit 1
fi

echo "=== 1. Install nginx + certbot ==="
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

echo "=== 2. Node.js (if missing) ==="
if ! command -v node &>/dev/null; then
  apt-get install -y nodejs npm 2>/dev/null || true
fi
if ! command -v node &>/dev/null; then
  echo "Node.js not found. Install it (e.g. apt install nodejs npm or nvm) and re-run."
  exit 1
fi

echo "=== 3. App directory and dependencies ==="
if [[ ! -d "$APP_DIR" ]]; then
  echo "App dir $APP_DIR not found. Clone or copy project there first."
  exit 1
fi
cd "$APP_DIR"
if [[ -d .git ]]; then
  git pull origin main || true
fi
RUN_USER="${SUDO_USER:-www-data}"
if [[ "$RUN_USER" != "www-data" ]] && [[ -f "/home/$RUN_USER/.nvm/nvm.sh" ]]; then
  sudo -u "$RUN_USER" bash -c "source /home/$RUN_USER/.nvm/nvm.sh; cd '$APP_DIR' && (npm ci --omit=dev || npm install --omit=dev)"
else
  (npm ci --omit=dev || npm install --omit=dev) || { echo "Run: cd $APP_DIR && npm install"; exit 1; }
fi

echo "=== 4. systemd service ==="
cat > /etc/systemd/system/sokoban-brawl.service << SVC
[Unit]
Description=Sokoban Brawl (Node.js)
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC
systemctl daemon-reload
systemctl enable sokoban-brawl
systemctl restart sokoban-brawl

echo "=== 5. Nginx site (HTTP first) ==="
mkdir -p /etc/nginx/sites-available
cat > /etc/nginx/sites-available/sokoban.lukwama.com << 'NGX'
server {
    listen 80;
    server_name sokoban.lukwama.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGX
sed -i "s|sokoban.lukwama.com|$DOMAIN|g" /etc/nginx/sites-available/sokoban.lukwama.com
ln -sf /etc/nginx/sites-available/sokoban.lukwama.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "=== 6. Certbot (HTTPS) ==="
CERTBOT_OPTS=(--nginx -d "$DOMAIN" --non-interactive --agree-tos)
[[ -n "$CERTBOT_EMAIL" ]] && CERTBOT_OPTS+=(--email "$CERTBOT_EMAIL") || CERTBOT_OPTS+=(--register-unsafely-without-email)
certbot "${CERTBOT_OPTS[@]}" || { echo "Certbot failed (DNS or port 80?). Fix and run: sudo certbot --nginx -d $DOMAIN"; exit 1; }

echo "=== 7. Firewall (optional) ==="
if command -v ufw &>/dev/null; then
  ufw allow 'Nginx Full' 2>/dev/null || true
  ufw allow ssh 2>/dev/null || true
  echo "y" | ufw enable 2>/dev/null || true
fi

echo "=== Done ==="
echo "  https://$DOMAIN"
systemctl status sokoban-brawl --no-pager -l || true

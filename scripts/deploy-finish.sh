#!/usr/bin/env bash
# Finish deploy: systemd + nginx + certbot. Run after npm install in project.
# Usage: cd /path/to/sokoban-brawl && npm install --omit=dev && sudo scripts/deploy-finish.sh
set -e

DOMAIN="${DOMAIN:-sokoban.lukwama.com}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}/.."
RUN_USER="${SUDO_USER:-www-data}"

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo."
  exit 1
fi

if [[ ! -d "$APP_DIR/node_modules" ]]; then
  echo "Run first: cd $APP_DIR && npm install --omit=dev"
  exit 1
fi

echo "=== systemd ==="
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

echo "=== Nginx ==="
cat > /etc/nginx/sites-available/sokoban.lukwama.com << 'NGX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
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
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" /etc/nginx/sites-available/sokoban.lukwama.com
ln -sf /etc/nginx/sites-available/sokoban.lukwama.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "=== Certbot ==="
CERTBOT_OPTS=(--nginx -d "$DOMAIN" --non-interactive --agree-tos)
[[ -n "${CERTBOT_EMAIL:-}" ]] && CERTBOT_OPTS+=(--email "$CERTBOT_EMAIL") || CERTBOT_OPTS+=(--register-unsafely-without-email)
certbot "${CERTBOT_OPTS[@]}" || echo "Certbot failed. Run: sudo certbot --nginx -d $DOMAIN"

echo "=== Done ==="
echo "  https://$DOMAIN"

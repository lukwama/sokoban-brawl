# Production deployment: https://sokoban.lukwama.com

### en_US (English)

This doc describes deploying **sokoban-brawl** on Ubuntu under the domain **sokoban.lukwama.com**. One host serves:

- **Website**: Single-player test and server verification UI (static + API)
- **Multiplayer**: Socket.io (same Node process/port)
- **Leaderboard**: REST API `/api/leaderboard/:levelId`, stored in SQLite

**Note**: Docs and code do not contain real host IPs, passwords, or keys; keep those in private notes.

#### Prerequisites

- Ubuntu 24.04 (recommended: complete [SERVER-SETUP.md](SERVER-SETUP.md) first)
- DNS for `sokoban.lukwama.com` pointing to your server’s public IP
- Node.js 18+, nginx, certbot installed

#### 1. Project and dependencies

On the server (e.g. `/opt/sokoban-brawl`):

```bash
cd /opt/sokoban-brawl
git pull origin main
npm ci --omit=dev
```

Optional env vars (set via systemd or `.env`; do not commit):

- `PORT`: App listen port (default 3000); reverse proxy forwards here
- `SQLITE_PATH`: Leaderboard DB path (default `server/data/sokoban.db`)

#### 2. systemd service

Create `/etc/systemd/system/sokoban-brawl.service` (adjust paths/user as needed):

```ini
[Unit]
Description=Sokoban Brawl (Node.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sokoban-brawl
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable sokoban-brawl
sudo systemctl start sokoban-brawl
sudo systemctl status sokoban-brawl
```

#### 3. Nginx reverse proxy and HTTPS

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Site config (e.g. `/etc/nginx/sites-available/sokoban.lukwama.com`):

```nginx
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
```

```bash
sudo ln -s /etc/nginx/sites-available/sokoban.lukwama.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d sokoban.lukwama.com
```

#### 4. Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

#### 5. Verification

- UI: https://sokoban.lukwama.com/
- Health: https://sokoban.lukwama.com/health
- Leaderboard: https://sokoban.lukwama.com/api/leaderboard/0
- Custom level direct link: https://sokoban.lukwama.com/singleplayer/57 (if level 57 exists; no extra Nginx config needed—Node serves the SPA for `/singleplayer/:levelId`).

Set client “Server URL” to `https://sokoban.lukwama.com` (no trailing slash).

#### Sensitive information

Do not put real server IPs, SSH credentials, passwords, API keys, or tokens in docs/code. Use env vars or local config; keep `.env` in `.gitignore`.

---

### zh_TW（繁體中文）

本文件說明在 Ubuntu 上將 **sokoban-brawl** 以網域 **sokoban.lukwama.com** 對外提供服務的步驟。同一台主機同時提供：

- **網站**：單人遊戲測試與伺服器驗證介面（靜態 + API）
- **多人遊戲**：Socket.io（與現有 Node 程序同一埠）
- **排行榜**：REST API `/api/leaderboard/:levelId`，資料存於 SQLite

**注意**：文件與程式碼中不包含實際主機 IP、密碼或金鑰；部署時請在伺服器或本機私有筆記中自行紀錄。

#### 前置條件

- Ubuntu 24.04（建議先完成 [SERVER-SETUP.md](SERVER-SETUP.md) 的 SSH、swap、fail2ban）
- 網域 `sokoban.lukwama.com` 的 DNS 已指向你的伺服器公網 IP
- 已安裝 Node.js 18+、nginx、certbot

#### 1. 專案與依賴

在伺服器上（例如 `/opt/sokoban-brawl`）：

```bash
cd /opt/sokoban-brawl
git pull origin main
npm ci --omit=dev
```

可選環境變數（建議以 systemd 或 `.env` 設定，勿提交至 Git）：

- `PORT`：應用監聽埠，預設 3000；反向代理將轉發到此埠
- `SQLITE_PATH`：排行榜資料庫路徑，預設 `server/data/sokoban.db`

#### 2. systemd 服務（常駐與開機啟動）

建立 `/etc/systemd/system/sokoban-brawl.service`（路徑與使用者請依實際調整）：

```ini
[Unit]
Description=Sokoban Brawl (Node.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sokoban-brawl
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable sokoban-brawl
sudo systemctl start sokoban-brawl
sudo systemctl status sokoban-brawl
```

#### 3. Nginx 反向代理與 HTTPS

安裝（若尚未安裝）：

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

為 `sokoban.lukwama.com` 建立站點（例如 `/etc/nginx/sites-available/sokoban.lukwama.com`）：（nginx 設定同 en_US 區塊）

啟用站點並取得憑證：

```bash
sudo ln -s /etc/nginx/sites-available/sokoban.lukwama.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d sokoban.lukwama.com
```

Certbot 會改寫設定以啟用 HTTPS。之後可透過 **https://sokoban.lukwama.com** 存取網站與 API。

#### 4. 防火牆

若使用 ufw，需放行 HTTP/HTTPS 與 SSH：

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

#### 5. 驗證

- 單人／驗證介面：https://sokoban.lukwama.com/
- 健康檢查：https://sokoban.lukwama.com/health
- 排行榜：https://sokoban.lukwama.com/api/leaderboard/0
- 自訂關卡直連：https://sokoban.lukwama.com/singleplayer/57（若關卡 57 存在即可開啟；無需額外 Nginx 設定，Node 會對 `/singleplayer/:levelId` 回傳 SPA。）

客戶端「伺服器網址」欄位可設為 `https://sokoban.lukwama.com`（無尾端斜線）以連到正式環境。

#### 敏感資訊提醒

- 請勿在文件或程式碼中寫入實際伺服器 IP、SSH 帳號、密碼、API 金鑰或 Token。
- 伺服器專用設定請使用環境變數或本機設定檔，並確保 `.env` 與敏感檔已列入 `.gitignore`。

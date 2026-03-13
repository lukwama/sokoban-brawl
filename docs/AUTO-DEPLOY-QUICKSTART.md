# Auto-Deploy Quick Start Guide

### en_US (English)

Quick setup guide for automatic deployment from GitHub to production server.

## 🚀 Quick Setup (5 minutes)

### 1. On Your Production Server (`sokoban.lukwama.com`)

```bash
# Navigate to your project directory (adjust path as needed)
cd /path/to/your/sokoban-brawl

# Pull latest code
git pull origin main

# Generate webhook secret
openssl rand -hex 32

# Create .env file with the secret
nano .env
```

**Note**: The deployment script auto-detects the project directory. You can override it by setting `REPO_DIR` in `.env` if needed.

Add to `.env`:
```bash
WEBHOOK_SECRET=<paste_the_generated_secret_here>
DEPLOY_BRANCH=main
PORT=3000
NODE_ENV=production
```

### 2. Configure Permissions

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Grant sudo permission for service restart
sudo visudo -f /etc/sudoers.d/sokoban-deploy
```

Add this line (replace `www-data` with your service user):
```
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart sokoban-brawl, /bin/systemctl is-active sokoban-brawl
```

```bash
# Create log file
sudo touch /var/log/sokoban-brawl-deploy.log
sudo chown www-data:www-data /var/log/sokoban-brawl-deploy.log

# Configure git for service user
sudo -u www-data git config --global --add safe.directory /opt/sokoban-brawl
```

### 3. Update systemd Service

```bash
sudo nano /etc/systemd/system/sokoban-brawl.service
```

Add `EnvironmentFile` line:
```ini
[Service]
...
EnvironmentFile=/opt/sokoban-brawl/.env
...
```

Reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart sokoban-brawl
```

### 4. Configure GitHub Webhook

1. Go to: https://github.com/lukwama/sokoban-brawl/settings/hooks
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: `https://sokoban.lukwama.com/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: (paste your `WEBHOOK_SECRET` from `.env`)
   - **Events**: Just the push event
   - **Active**: ✓ Checked
4. Click **Add webhook**

### 5. Test It!

```bash
# On your local machine, push a test commit
git commit --allow-empty -m "Test auto-deployment"
git push origin main

# On production server, watch the deployment log
sudo tail -f /var/log/sokoban-brawl-deploy.log
```

✅ **Done!** Every push to `main` will now automatically deploy to production.

## 📚 Full Documentation

See [AUTO-DEPLOY.md](AUTO-DEPLOY.md) for:
- Detailed setup instructions
- Troubleshooting guide
- Security best practices
- Advanced configuration options

---

### zh_TW（繁體中文）

從 GitHub 到正式環境伺服器的自動部署快速設置指南。

## 🚀 快速設置（5 分鐘）

### 1. 在你的正式環境伺服器上（`sokoban.lukwama.com`）

```bash
# 導航到你的專案目錄（依實際路徑調整）
cd /path/to/your/sokoban-brawl

# 拉取最新程式碼
git pull origin main

# 產生 webhook 密鑰
openssl rand -hex 32

# 建立 .env 檔案並加入密鑰
nano .env
```

**注意**：部署腳本會自動偵測專案目錄。如需要，可以在 `.env` 中設定 `REPO_DIR` 覆寫。

加入到 `.env`：
```bash
WEBHOOK_SECRET=<貼上剛才產生的密鑰>
DEPLOY_BRANCH=main
PORT=3000
NODE_ENV=production
```

### 2. 配置權限

```bash
# 設置部署腳本為可執行
chmod +x scripts/deploy.sh

# 授予 sudo 權限以重啟服務
sudo visudo -f /etc/sudoers.d/sokoban-deploy
```

加入此行（將 `www-data` 替換為你的服務使用者）：
```
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart sokoban-brawl, /bin/systemctl is-active sokoban-brawl
```

```bash
# 建立日誌檔案
sudo touch /var/log/sokoban-brawl-deploy.log
sudo chown www-data:www-data /var/log/sokoban-brawl-deploy.log

# 為服務使用者配置 git
sudo -u www-data git config --global --add safe.directory /opt/sokoban-brawl
```

### 3. 更新 systemd 服務

```bash
sudo nano /etc/systemd/system/sokoban-brawl.service
```

加入 `EnvironmentFile` 行：
```ini
[Service]
...
EnvironmentFile=/opt/sokoban-brawl/.env
...
```

重新載入並重啟：
```bash
sudo systemctl daemon-reload
sudo systemctl restart sokoban-brawl
```

### 4. 配置 GitHub Webhook

1. 前往：https://github.com/lukwama/sokoban-brawl/settings/hooks
2. 點擊 **Add webhook**
3. 配置：
   - **Payload URL**：`https://sokoban.lukwama.com/webhook/github`
   - **Content type**：`application/json`
   - **Secret**：（貼上你在 `.env` 中的 `WEBHOOK_SECRET`）
   - **Events**：Just the push event
   - **Active**：✓ 勾選
4. 點擊 **Add webhook**

### 5. 測試！

```bash
# 在本機，推送一個測試提交
git commit --allow-empty -m "Test auto-deployment"
git push origin main

# 在正式環境伺服器上，觀察部署日誌
sudo tail -f /var/log/sokoban-brawl-deploy.log
```

✅ **完成！**現在每次推送到 `main` 分支都會自動部署到正式環境。

## 📚 完整文檔

詳見 [AUTO-DEPLOY.md](AUTO-DEPLOY.md)：
- 詳細設置說明
- 故障排除指南
- 安全最佳實踐
- 進階配置選項

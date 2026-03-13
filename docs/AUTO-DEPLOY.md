# Auto-Deployment Setup Guide

### en_US (English)

This guide explains how to set up **automatic deployment** for Sokoban Brawl using **GitHub Webhooks**. When you push changes to GitHub, the production server will automatically pull the latest code, install dependencies, and restart the service.

## Overview

The auto-deployment system consists of:

1. **GitHub Webhook**: Sends a POST request to your server when code is pushed
2. **Webhook Endpoint**: Express route in `server/index.js` that receives and validates webhooks
3. **Deployment Script**: `scripts/deploy.sh` that pulls code, installs dependencies, and restarts the service

## Prerequisites

- Production server already set up (see [DEPLOYMENT.md](DEPLOYMENT.md))
- Server running with systemd service (`sokoban-brawl.service`)
- GitHub repository access
- Server accessible from the internet (for GitHub to send webhooks)

## Setup Steps

### 1. Configure Server Environment Variables

On your production server, create or edit `/opt/sokoban-brawl/.env`:

```bash
cd /opt/sokoban-brawl
nano .env
```

Add these variables (or use systemd environment file):

```bash
# Generate a secure secret: openssl rand -hex 32
WEBHOOK_SECRET=your_secure_random_string_here
DEPLOY_BRANCH=main
PORT=3000
NODE_ENV=production
```

**Important**: Keep `WEBHOOK_SECRET` secure and never commit it to Git.

### 2. Configure Deployment Script Permissions

The deployment script needs to run `git`, `npm`, and `systemctl` commands:

```bash
cd /opt/sokoban-brawl
chmod +x scripts/deploy.sh
```

#### Grant sudo permissions for service restart

The deployment script needs to restart the systemd service without password prompt. Create a sudoers rule:

```bash
sudo visudo -f /etc/sudoers.d/sokoban-deploy
```

Add this line (replace `www-data` with your service user):

```
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart sokoban-brawl, /bin/systemctl is-active sokoban-brawl
```

Save and exit. Test it:

```bash
sudo -u www-data sudo systemctl restart sokoban-brawl
```

#### Create log directory

```bash
sudo mkdir -p /var/log
sudo touch /var/log/sokoban-brawl-deploy.log
sudo chown www-data:www-data /var/log/sokoban-brawl-deploy.log
```

#### Configure git for the service user

```bash
sudo -u www-data git config --global user.name "Auto Deploy"
sudo -u www-data git config --global user.email "deploy@sokoban.lukwama.com"
sudo -u www-data git config --global --add safe.directory /opt/sokoban-brawl
```

### 3. Update systemd Service (Load Environment Variables)

Edit your systemd service file to load the `.env` file:

```bash
sudo nano /etc/systemd/system/sokoban-brawl.service
```

Add `EnvironmentFile` directive:

```ini
[Unit]
Description=Sokoban Brawl (Node.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sokoban-brawl
EnvironmentFile=/opt/sokoban-brawl/.env
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart sokoban-brawl
sudo systemctl status sokoban-brawl
```

### 4. Configure GitHub Webhook

Go to your GitHub repository settings:

1. Navigate to: **Settings** → **Webhooks** → **Add webhook**
2. Configure:
   - **Payload URL**: `https://sokoban.lukwama.com/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: (paste the same `WEBHOOK_SECRET` from your `.env`)
   - **Which events**: Select "Just the push event"
   - **Active**: ✓ Checked

3. Click **Add webhook**

### 5. Test the Webhook

#### Method 1: Push a test commit

```bash
# On your local machine
git commit --allow-empty -m "Test auto-deployment"
git push origin main
```

Check the deployment log on your server:

```bash
sudo tail -f /var/log/sokoban-brawl-deploy.log
```

#### Method 2: Manually trigger from GitHub

1. Go to **Settings** → **Webhooks** → click your webhook
2. Scroll to "Recent Deliveries"
3. Click a delivery → **Redeliver**

### 6. Verify Deployment

After pushing code, verify the changes are live:

1. Check the deployment log:
   ```bash
   sudo tail -n 50 /var/log/sokoban-brawl-deploy.log
   ```

2. Check service status:
   ```bash
   sudo systemctl status sokoban-brawl
   ```

3. Check the website:
   ```bash
   curl https://sokoban.lukwama.com/health
   ```

## Troubleshooting

### Webhook not triggering

- Check GitHub webhook delivery status: **Settings** → **Webhooks** → recent deliveries
- Verify server is accessible from internet: `curl https://sokoban.lukwama.com/health`
- Check nginx/firewall settings

### Signature verification failed

- Ensure `WEBHOOK_SECRET` matches exactly in both `.env` and GitHub webhook settings
- No extra spaces or newlines in the secret

### Deployment script fails

Check the log file:

```bash
sudo tail -n 100 /var/log/sokoban-brawl-deploy.log
```

Common issues:

- **Permission denied**: Check sudo permissions in `/etc/sudoers.d/sokoban-deploy`
- **Git pull failed**: Check if there are uncommitted local changes (script will stash them)
- **npm ci failed**: Check Node.js version and network connectivity

### Service won't restart

```bash
# Check service logs
sudo journalctl -u sokoban-brawl -n 50 -f

# Manually restart to see errors
sudo systemctl restart sokoban-brawl
```

## Security Notes

1. **Never commit secrets**: Keep `.env` in `.gitignore` (already configured)
2. **Use strong webhook secret**: Generate with `openssl rand -hex 32`
3. **Limit sudo permissions**: Only grant restart permission for the specific service
4. **Monitor logs**: Regularly check `/var/log/sokoban-brawl-deploy.log` for suspicious activity
5. **HTTPS only**: Always use HTTPS for webhook endpoint

## Advanced Configuration

### Deploy only specific branches

Edit `.env` to change target branch:

```bash
DEPLOY_BRANCH=production
```

### Custom deployment actions

Edit `scripts/deploy.sh` to add custom steps:

- Database migrations
- Asset compilation
- Cache clearing
- Notification sending (e.g., Slack, Discord)

### Rollback

If deployment fails, manually rollback:

```bash
cd /opt/sokoban-brawl
git log --oneline -10  # Find the commit hash to rollback to
git reset --hard <commit-hash>
npm ci --omit=dev
sudo systemctl restart sokoban-brawl
```

---

### zh_TW（繁體中文）

本指南說明如何為 Sokoban Brawl 設定 **自動部署**，使用 **GitHub Webhooks** 機制。當你推送程式碼到 GitHub 時，正式環境伺服器將自動拉取最新程式碼、安裝依賴並重啟服務。

## 概述

自動部署系統包含：

1. **GitHub Webhook**：當程式碼推送時向伺服器發送 POST 請求
2. **Webhook 端點**：`server/index.js` 中的 Express 路由，接收並驗證 webhook
3. **部署腳本**：`scripts/deploy.sh` 拉取程式碼、安裝依賴並重啟服務

## 前置需求

- 正式環境伺服器已設置完成（參見 [DEPLOYMENT.md](DEPLOYMENT.md)）
- 伺服器使用 systemd 服務運行（`sokoban-brawl.service`）
- 擁有 GitHub 儲存庫存取權限
- 伺服器可從網際網路存取（讓 GitHub 能發送 webhook）

## 設定步驟

### 1. 配置伺服器環境變數

在正式環境伺服器上，建立或編輯 `/opt/sokoban-brawl/.env`：

```bash
cd /opt/sokoban-brawl
nano .env
```

加入這些變數（或使用 systemd 環境檔案）：

```bash
# 產生安全密鑰：openssl rand -hex 32
WEBHOOK_SECRET=你的安全隨機字串
DEPLOY_BRANCH=main
PORT=3000
NODE_ENV=production
```

**重要**：保持 `WEBHOOK_SECRET` 安全，切勿提交至 Git。

### 2. 配置部署腳本權限

部署腳本需要執行 `git`、`npm` 和 `systemctl` 指令：

```bash
cd /opt/sokoban-brawl
chmod +x scripts/deploy.sh
```

#### 授予 sudo 權限以重啟服務

部署腳本需要無密碼提示重啟 systemd 服務。建立 sudoers 規則：

```bash
sudo visudo -f /etc/sudoers.d/sokoban-deploy
```

加入此行（將 `www-data` 替換為你的服務使用者）：

```
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart sokoban-brawl, /bin/systemctl is-active sokoban-brawl
```

儲存並退出。測試：

```bash
sudo -u www-data sudo systemctl restart sokoban-brawl
```

#### 建立日誌目錄

```bash
sudo mkdir -p /var/log
sudo touch /var/log/sokoban-brawl-deploy.log
sudo chown www-data:www-data /var/log/sokoban-brawl-deploy.log
```

#### 為服務使用者配置 git

```bash
sudo -u www-data git config --global user.name "Auto Deploy"
sudo -u www-data git config --global user.email "deploy@sokoban.lukwama.com"
sudo -u www-data git config --global --add safe.directory /opt/sokoban-brawl
```

### 3. 更新 systemd 服務（載入環境變數）

編輯 systemd 服務檔案以載入 `.env`：

```bash
sudo nano /etc/systemd/system/sokoban-brawl.service
```

加入 `EnvironmentFile` 指令：

```ini
[Unit]
Description=Sokoban Brawl (Node.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sokoban-brawl
EnvironmentFile=/opt/sokoban-brawl/.env
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

重新載入並重啟：

```bash
sudo systemctl daemon-reload
sudo systemctl restart sokoban-brawl
sudo systemctl status sokoban-brawl
```

### 4. 配置 GitHub Webhook

前往 GitHub 儲存庫設定：

1. 導航至：**Settings** → **Webhooks** → **Add webhook**
2. 配置：
   - **Payload URL**：`https://sokoban.lukwama.com/webhook/github`
   - **Content type**：`application/json`
   - **Secret**：（貼上與 `.env` 中相同的 `WEBHOOK_SECRET`）
   - **Which events**：選擇「Just the push event」
   - **Active**：✓ 勾選

3. 點擊 **Add webhook**

### 5. 測試 Webhook

#### 方法 1：推送測試提交

```bash
# 在本機
git commit --allow-empty -m "Test auto-deployment"
git push origin main
```

在伺服器上檢查部署日誌：

```bash
sudo tail -f /var/log/sokoban-brawl-deploy.log
```

#### 方法 2：從 GitHub 手動觸發

1. 前往 **Settings** → **Webhooks** → 點擊你的 webhook
2. 捲動至「Recent Deliveries」
3. 點擊一個交付 → **Redeliver**

### 6. 驗證部署

推送程式碼後，驗證更改已上線：

1. 檢查部署日誌：
   ```bash
   sudo tail -n 50 /var/log/sokoban-brawl-deploy.log
   ```

2. 檢查服務狀態：
   ```bash
   sudo systemctl status sokoban-brawl
   ```

3. 檢查網站：
   ```bash
   curl https://sokoban.lukwama.com/health
   ```

## 故障排除

### Webhook 未觸發

- 檢查 GitHub webhook 交付狀態：**Settings** → **Webhooks** → recent deliveries
- 驗證伺服器可從網際網路存取：`curl https://sokoban.lukwama.com/health`
- 檢查 nginx/防火牆設定

### 簽章驗證失敗

- 確保 `.env` 和 GitHub webhook 設定中的 `WEBHOOK_SECRET` 完全一致
- 密鑰中無多餘空格或換行

### 部署腳本失敗

檢查日誌檔案：

```bash
sudo tail -n 100 /var/log/sokoban-brawl-deploy.log
```

常見問題：

- **Permission denied**：檢查 `/etc/sudoers.d/sokoban-deploy` 中的 sudo 權限
- **Git pull failed**：檢查是否有未提交的本機變更（腳本會暫存它們）
- **npm ci failed**：檢查 Node.js 版本和網路連線

### 服務無法重啟

```bash
# 檢查服務日誌
sudo journalctl -u sokoban-brawl -n 50 -f

# 手動重啟以查看錯誤
sudo systemctl restart sokoban-brawl
```

## 安全注意事項

1. **切勿提交密鑰**：保持 `.env` 在 `.gitignore` 中（已配置）
2. **使用強 webhook 密鑰**：使用 `openssl rand -hex 32` 生成
3. **限制 sudo 權限**：僅授予特定服務的重啟權限
4. **監控日誌**：定期檢查 `/var/log/sokoban-brawl-deploy.log` 是否有可疑活動
5. **僅使用 HTTPS**：webhook 端點必須使用 HTTPS

## 進階配置

### 僅部署特定分支

編輯 `.env` 更改目標分支：

```bash
DEPLOY_BRANCH=production
```

### 自訂部署動作

編輯 `scripts/deploy.sh` 加入自訂步驟：

- 資料庫遷移
- 資源編譯
- 快取清除
- 發送通知（如 Slack、Discord）

### 回滾

如果部署失敗，手動回滾：

```bash
cd /opt/sokoban-brawl
git log --oneline -10  # 找到要回滾的提交雜湊
git reset --hard <commit-hash>
npm ci --omit=dev
sudo systemctl restart sokoban-brawl
```

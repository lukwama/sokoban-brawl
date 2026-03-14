# 如何使用自動部署 / How to Use Auto-Deploy

## 🚀 給遠端伺服器 Cursor AI Agent 的指令 / Prompt for Remote Agent

### 中文指令（複製此段給連接到 sokoban.lukwama.com 的 Cursor Agent）

```
請為這台 Sokoban Brawl 伺服器設置 GitHub webhook 自動部署，按照以下步驟進行：

重要：使用當前工作目錄作為專案根目錄，不要硬編碼 /opt/sokoban-brawl 路徑。

1. **驗證並拉取最新程式碼**：
   - 使用 pwd 檢查當前目錄
   - 驗證這是 git 儲存庫：git status
   - 執行：git pull origin main
   - 確認最新的自動部署檔案已存在（應有 docs/AUTO-DEPLOY-QUICKSTART.md）

2. **查閱文檔**：
   - 閱讀 docs/AUTO-DEPLOY-QUICKSTART.md 快速設置步驟
   - 閱讀 docs/AUTO-DEPLOY.md 詳細配置說明

3. **配置自動部署**（依照快速入門指南）：
   - 使用此指令產生 webhook 密鑰：openssl rand -hex 32
   - 在專案根目錄建立 .env 檔案，內容包含：
     * WEBHOOK_SECRET=（剛產生的密鑰）
     * DEPLOY_BRANCH=main
     * PORT=3000
     * NODE_ENV=production
   - 注意：部署腳本會自動偵測專案目錄
   
4. **設置權限**：
   - 設定 scripts/deploy.sh 為可執行
   - 建立 sudoers 檔案以允許無密碼重啟服務
   - 建立部署日誌檔案並設定正確的擁有者
   - 為 www-data 使用者配置 git safe.directory

5. **更新 systemd 服務**：
   - 偵測 systemd 服務名稱（通常是 sokoban-brawl.service）
   - 取得服務檔案路徑：systemctl status sokoban-brawl | grep Loaded
   - 在服務配置中加入 EnvironmentFile=<專案目錄>/.env（使用實際專案路徑）
   - 確保 WorkingDirectory 指向專案根目錄
   - 重新載入 systemd daemon 並重啟服務

6. **驗證設置**：
   - 檢查服務狀態
   - 在本機測試 webhook 端點
   - 確認伺服器正確回應

7. **輸出 GitHub webhook 配置資訊**：
   - 顯示 WEBHOOK_SECRET 值（我需要複製到 GitHub 設定）
   - 顯示 webhook 網址：https://sokoban.lukwama.com/webhook/github
   - 提醒我在此處配置：https://github.com/lukwama/sokoban-brawl/settings/hooks

請一步一步進行，確認每個步驟成功後再繼續下一步，並在最後顯示 webhook 密鑰。
```

### English Prompt (Copy this to Cursor Agent connected to sokoban.lukwama.com)

```
Please set up GitHub webhook auto-deployment for this Sokoban Brawl server following these steps:

IMPORTANT: Use the current working directory as the project root. Do not hardcode /opt/sokoban-brawl.

1. **Verify and pull latest code**:
   - Check current directory with: pwd
   - Verify this is a git repository: git status
   - Execute: git pull origin main
   - Verify the latest auto-deploy files are present (docs/AUTO-DEPLOY-QUICKSTART.md should exist)

2. **Review documentation**:
   - Read docs/AUTO-DEPLOY-QUICKSTART.md for quick setup steps
   - Read docs/AUTO-DEPLOY.md for detailed configuration

3. **Configure auto-deployment** by following the quick start guide:
   - Generate webhook secret using: openssl rand -hex 32
   - Create .env file in the project root directory with:
     * WEBHOOK_SECRET=(generated secret)
     * DEPLOY_BRANCH=main
     * PORT=3000
     * NODE_ENV=production
   - Note: The deployment script will auto-detect the project directory

4. **Set up permissions**:
   - Make scripts/deploy.sh executable
   - Create sudoers file for passwordless service restart
   - Create deployment log file with correct ownership
   - Configure git safe.directory for www-data user

5. **Update systemd service**:
   - Detect the systemd service name (likely sokoban-brawl.service)
   - Get the service file path: systemctl status sokoban-brawl | grep Loaded
   - Add EnvironmentFile=<PROJECT_DIR>/.env to service configuration (use actual project path)
   - Ensure WorkingDirectory points to the project root
   - Reload systemd daemon and restart service

6. **Verify setup**:
   - Check service status
   - Test webhook endpoint locally
   - Confirm server is responding correctly

7. **Output for GitHub webhook configuration**:
   - Display the WEBHOOK_SECRET value (I need to copy it to GitHub settings)
   - Show the webhook URL: https://sokoban.lukwama.com/webhook/github
   - Remind me to configure it at: https://github.com/lukwama/sokoban-brawl/settings/hooks

Please proceed step by step, confirm each step is successful before moving to the next, and show me the webhook secret at the end.
```

---

## 📝 Agent 完成後你要做什麼 / What to Do After Agent Completes

### 步驟 1：配置 GitHub Webhook

1. 前往：https://github.com/lukwama/sokoban-brawl/settings/hooks
2. 點擊 **Add webhook**
3. 配置：
   - **Payload URL**：`https://sokoban.lukwama.com/webhook/github`
   - **Content type**：`application/json`
   - **Secret**：（貼上 Agent 輸出的 WEBHOOK_SECRET）
   - **Events**：Just the push event
   - **Active**：✓ 勾選
4. 點擊 **Add webhook**

### 步驟 2：測試部署

在本機執行：

```bash
git commit --allow-empty -m "Test auto-deployment"
git push origin main
```

然後請遠端 Agent 檢查日誌：

```
請檢查部署日誌以驗證自動部署是否運作：
sudo tail -n 50 /var/log/sokoban-brawl-deploy.log
```

### 步驟 3：驗證網站

瀏覽器開啟 https://sokoban.lukwama.com 確認網站正常運作。

---

## ✅ 完成！/ Done!

之後每次你推送到 `main` 分支，遠端伺服器都會自動：
1. 拉取最新程式碼
2. 安裝依賴
3. 重啟服務

After this, every time you push to `main` branch, the remote server will automatically:
1. Pull latest code
2. Install dependencies
3. Restart service

---

## 📚 相關文檔 / Related Documentation

- 完整設置指南 / Full Setup Guide: `docs/AUTO-DEPLOY.md`
- 快速入門 / Quick Start: `docs/AUTO-DEPLOY-QUICKSTART.md`
- 路徑偵測說明 / Path Detection: `docs/PATH-DETECTION-EXPLAINED.md`
- 功能總結 / Feature Summary: `docs/AUTO-DEPLOY-SUMMARY.md`

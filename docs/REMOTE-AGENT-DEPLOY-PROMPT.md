# Remote Agent Deployment Prompt

### en_US (English)

This file contains ready-to-use prompts for Cursor AI Agent to set up auto-deployment on your remote production server.

## 📋 Prompt for Remote Agent

Copy and paste this prompt to your Cursor AI Agent connected to `sokoban.lukwama.com`:

---

**Prompt:**

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

## 🔑 After Agent Completes Setup

The agent will output your `WEBHOOK_SECRET`. Use it to configure GitHub webhook:

1. Go to: https://github.com/lukwama/sokoban-brawl/settings/hooks
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: `https://sokoban.lukwama.com/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: (paste the WEBHOOK_SECRET from agent output)
   - **Events**: Just the push event
   - **Active**: ✓ Checked
4. Click **Add webhook**

## ✅ Test the Deployment

After GitHub webhook is configured:

```bash
# On your local machine
git commit --allow-empty -m "Test auto-deployment"
git push origin main
```

Then ask the remote agent to check:
```
Please check the deployment log to verify the auto-deployment worked:
sudo tail -n 50 /var/log/sokoban-brawl-deploy.log
```

---

### zh_TW（繁體中文）

此檔案包含給 Cursor AI Agent 的即用指令範本，用於在遠端正式環境伺服器上設置自動部署。

## 📋 遠端 Agent 指令範本

複製並貼上此指令給連接到 `sokoban.lukwama.com` 的 Cursor AI Agent：

---

**指令範本：**

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

---

## 🔑 Agent 完成設置後

Agent 會輸出你的 `WEBHOOK_SECRET`。使用它來配置 GitHub webhook：

1. 前往：https://github.com/lukwama/sokoban-brawl/settings/hooks
2. 點擊 **Add webhook**
3. 配置：
   - **Payload URL**：`https://sokoban.lukwama.com/webhook/github`
   - **Content type**：`application/json`
   - **Secret**：（貼上 agent 輸出的 WEBHOOK_SECRET）
   - **Events**：Just the push event
   - **Active**：✓ 勾選
4. 點擊 **Add webhook**

## ✅ 測試部署

在 GitHub webhook 配置完成後：

```bash
# 在你的本機
git commit --allow-empty -m "Test auto-deployment"
git push origin main
```

然後請遠端 agent 檢查：
```
請檢查部署日誌以驗證自動部署是否運作：
sudo tail -n 50 /var/log/sokoban-brawl-deploy.log
```

---

## 💡 Additional Tips / 額外提示

### If agent encounters issues / 如果 agent 遇到問題：

**Permission issues / 權限問題：**
```
Please check the user running the service and adjust file permissions accordingly:
- Service user: check with `systemctl status sokoban-brawl`
- File ownership: `sudo chown -R <service-user>:<service-user> /opt/sokoban-brawl`
```

**Service not restarting / 服務無法重啟：**
```
Please check the systemd service logs and fix any issues:
sudo journalctl -u sokoban-brawl -n 50 --no-pager
```

**Git pull conflicts / Git 拉取衝突：**
```
If there are local changes conflicting with remote, please stash them first:
git stash
git pull origin main
```

---

## 📞 Need Help? / 需要協助？

If the agent gets stuck, you can:
- Check the detailed troubleshooting section in `docs/AUTO-DEPLOY.md`
- Ask the agent to read specific sections of the documentation
- Manually follow the steps in `docs/AUTO-DEPLOY-QUICKSTART.md`

如果 agent 卡住了，你可以：
- 查閱 `docs/AUTO-DEPLOY.md` 中的詳細故障排除章節
- 要求 agent 閱讀文檔的特定章節
- 手動按照 `docs/AUTO-DEPLOY-QUICKSTART.md` 的步驟操作

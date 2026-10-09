# Manual Deploy Steps (Production Server)

### en_US

When PR is merged to `main`, the production server at **sokoban.lukwama.com** normally deploys automatically via GitHub Webhook. If the webhook did not run or you need to deploy by hand, use the steps below on the **actual production host**.

**Important:** On the current production server, the repo path is **not** `/opt/sokoban-brawl`. Use the path below.

```bash
# 1. Go to repo (this server's actual path)
cd /home/sokoban/sokuban-project/sokoban-brawl

# 2. Fetch and hard-reset to origin/main
git fetch origin main
git checkout main
git reset --hard origin/main

# 3. Install deps and restart
npm ci --omit=dev
sudo systemctl restart sokoban-brawl

# 4. Confirm running version (version should match latest commit)
curl -s http://localhost:3000/health | jq .
# Or: curl -s http://localhost:3000/health
# Check that "version" equals: git rev-parse --short HEAD
```

---

### zh_TW

PR 合併到 `main` 後，**sokoban.lukwama.com** 正式站通常會經由 GitHub Webhook 自動部署。若 webhook 未觸發或需手動部署，請在**實際正式機**上依下列步驟操作。

**注意：** 目前正式機的專案路徑**不是** `/opt/sokoban-brawl`，請使用下方路徑。

```bash
# 1. 進入專案目錄（本機實際路徑）
cd /home/sokoban/sokuban-project/sokoban-brawl

# 2. 拉取並強制與 origin/main 一致
git fetch origin main
git checkout main
git reset --hard origin/main

# 3. 安裝依賴並重啟服務
npm ci --omit=dev
sudo systemctl restart sokoban-brawl

# 4. 確認版本（version 應為最新 commit 短雜湊）
curl -s http://localhost:3000/health | jq .
# 或：curl -s http://localhost:3000/health
# 確認 "version" 與 git rev-parse --short HEAD 一致
```

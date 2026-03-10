# Cursor 開發環境設定

## GitHub MCP 連線

本專案已設定 GitHub 官方 MCP，可讓 Agent 直接操作 GitHub（搜尋程式碼、管理 Issue、PR 等）。

### 完成 MCP 設定

1. **建立 GitHub Personal Access Token**
   - 前往 https://github.com/settings/tokens/new
   - 建議勾選 `repo` 權限（完整倉庫存取）
   - 產生並複製 Token

2. **更新 MCP 設定**
   - 開啟 `~/.cursor/mcp.json`（全域設定）
   - 將 `YOUR_GITHUB_PAT` 替換為你的實際 Token
   - 儲存檔案

3. **重啟 Cursor**
   - 完全關閉並重新開啟 Cursor

4. **驗證連線**
   - 開啟 **Settings** → **Tools & MCP** → 確認 `github` 旁有綠點
   - 在 Chat 中測試：「列出我的 GitHub 倉庫」

### 設定檔位置
- **全域**：`~/.cursor/mcp.json`（個人使用，勿提交至 Git）
- **專案**：`.cursor/mcp.json`（可與團隊共用設定結構）

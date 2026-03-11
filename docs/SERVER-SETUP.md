# Ubuntu 24.04 server setup

### en_US (English)

This doc describes setting up a **fresh Ubuntu 24.04.3 LTS** server for stable SSH, sufficient resources, basic hardening, and cloning the **sokoban-brawl** project.

#### Summary

| Item | Description |
|------|-------------|
| **SSH resource protection** | Ensure ssh has enough resources, lower OOM kill priority, auto-restart on failure |
| **Swap** | Add swap to reduce OOM risk |
| **Brute-force protection** | fail2ban for SSH login failures |
| **Project** | Clone `lukwama/sokoban-brawl` from GitHub |

#### Option 1: One-shot script (recommended)

As **root** or **sudo** on the server:

```bash
cd /path/to/sokoban-brawl/scripts
sudo chmod +x setup-ubuntu-server.sh
sudo ./setup-ubuntu-server.sh
```

**Optional env vars:** `SWAP_SIZE_GB=2`, `SWAPPINESS=60`, `CLONE_DIR=/opt/sokoban-brawl`. Example: `sudo SWAP_SIZE_GB=4 CLONE_DIR=/home/deploy/sokoban-brawl ./setup-ubuntu-server.sh`

#### Option 2: Manual steps

**1. Swap:** `sudo fallocate -l 2G /swapfile`, `chmod 600`, `mkswap`, `swapon`, add to `/etc/fstab`; optionally set `vm.swappiness` in `/etc/sysctl.d/`.

**2. SSH protection (Ubuntu 24.04 ssh.service / ssh.socket):** Copy `scripts/ssh-resource-protection.conf` to `/etc/systemd/system/ssh.service.d/override.conf`, `scripts/ssh-socket-protection.conf` to `/etc/systemd/system/ssh.socket.d/override.conf`, then `systemctl daemon-reload` and `systemctl restart ssh.socket`.

**3. fail2ban:** Install fail2ban, copy `scripts/fail2ban-sshd.local` to `/etc/fail2ban/jail.d/sshd.local`, enable and start fail2ban. Default: 5 failures in 10m → ban 1 day.

**4. Clone project:** `sudo git clone https://github.com/lukwama/sokoban-brawl.git /opt/sokoban-brawl` (or use `CLONE_DIR`).

#### Notes

- **Sensitive info**: Do not put real host IPs, SSH accounts, or passwords in docs/code; keep in private notes (e.g. `ssh user@YOUR_SERVER_IP`).
- fail2ban: If SSH port is changed, set `port` in `jail.d/sshd.local`.
- Firewall: `sudo ufw allow ssh && sudo ufw enable` if using ufw.
- Keep an existing SSH session when testing the script to avoid lockout.
- Default clone path: `/opt/sokoban-brawl` (override with `CLONE_DIR`).

---

### zh_TW（繁體中文）

# Ubuntu 24.04 伺服器設定指南

本文件說明在**全新 Ubuntu 24.04.3 LTS** 上，為維持 SSH 連線穩定、資源充足與基本防駭，並準備 **sokoban-brawl** 專案開發環境的設定步驟。

---

## 目標摘要

| 項目 | 說明 |
|------|------|
| **SSH 資源保護** | 確保 ssh 服務有足夠資源、OOM 時較不易被殺、異常時自動重啟 |
| **虛擬記憶體 (swap)** | 建立 swap，降低因記憶體耗盡而當機的風險 |
| **防暴力破解** | 使用 fail2ban 對 SSH 登入失敗進行封鎖 |
| **專案部署** | 從 GitHub 拉取 `lukwama/sokoban-brawl` 最新版本 |

---

## 方式一：一鍵腳本（建議）

在伺服器上取得本專案後，以 **root** 或 **sudo** 執行：

```bash
# 若尚未有專案，可先從 GitHub 拉取僅含腳本的目錄，或先手動上傳 scripts/
cd /path/to/sokoban-brawl/scripts
sudo chmod +x setup-ubuntu-server.sh
sudo ./setup-ubuntu-server.sh
```

**可選環境變數：**

- `SWAP_SIZE_GB=2`：swap 大小（GB），預設 2
- `SWAPPINESS=60`：swappiness，預設 60（0–100，愈小愈少用 swap）
- `CLONE_DIR=/opt/sokoban-brawl`：專案克隆目錄

範例：

```bash
sudo SWAP_SIZE_GB=4 CLONE_DIR=/home/deploy/sokoban-brawl ./setup-ubuntu-server.sh
```

---

## 方式二：手動步驟

### 1. 虛擬記憶體 (swap)

```bash
# 建立 2GB swap 檔案（可依實體記憶體調整）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 可選：設定 swappiness（例如 60）
echo 'vm.swappiness=60' | sudo tee /etc/sysctl.d/99-swap-reserve.conf
sudo sysctl -p /etc/sysctl.d/99-swap-reserve.conf
```

### 2. SSH 資源保護（Ubuntu 24.04 為 ssh.service / ssh.socket）

```bash
sudo mkdir -p /etc/systemd/system/ssh.service.d
sudo cp scripts/ssh-resource-protection.conf /etc/systemd/system/ssh.service.d/override.conf

sudo mkdir -p /etc/systemd/system/ssh.socket.d
sudo cp scripts/ssh-socket-protection.conf /etc/systemd/system/ssh.socket.d/override.conf

sudo systemctl daemon-reload
sudo systemctl restart ssh.socket
```

效果摘要：

- **MemoryMin**：保障 ssh 最低記憶體
- **OOMScoreAdjust=-500**：降低被 OOM killer 選中的機率
- **Restart=on-failure**：異常結束時自動重啟

### 3. fail2ban 防暴力破解

```bash
sudo apt-get update
sudo apt-get install -y fail2ban
sudo cp scripts/fail2ban-sshd.local /etc/fail2ban/jail.d/sshd.local
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
```

預設行為（可在 `jail.d/sshd.local` 調整）：

- **bantime**：封鎖 1 天
- **findtime**：10 分鐘內
- **maxretry**：5 次失敗即封鎖

查看狀態：

```bash
sudo fail2ban-client status sshd
```

### 4. 拉取 sokoban-brawl 專案

```bash
sudo mkdir -p /opt
sudo git clone https://github.com/lukwama/sokoban-brawl.git /opt/sokoban-brawl
cd /opt/sokoban-brawl
git pull origin main   # 之後更新用
```

---

## 注意事項

- **敏感資訊**：本專案為開源，文件與程式碼中請勿寫入實際主機 IP、SSH 帳號或密碼。連線資訊請僅保留於本機或私有筆記（例如 `ssh 使用者@YOUR_SERVER_IP`）。
1. **fail2ban**：若改過 SSH 埠號，請在 `jail.d/sshd.local` 中設定 `port = 你的埠號`。
2. **防火牆**：若有使用 `ufw`，記得放行 SSH：`sudo ufw allow ssh && sudo ufw enable`。
3. **首次執行腳本**：建議保留一個已登入的 SSH 連線，在另一個終端測試新連線，確認沒被誤封再登出。
4. **專案路徑**：腳本預設克隆到 `/opt/sokoban-brawl`，可透過環境變數 `CLONE_DIR` 修改。

完成以上設定後，伺服器具備基本 swap、SSH 資源保護與防暴力破解，並已備好 **sokoban-brawl** 專案供開發與實測。

#!/usr/bin/env bash
# =============================================================================
# Ubuntu 24.04 伺服器一鍵設定腳本
# 用途：SSH 資源保護、swap、fail2ban、拉取 sokoban-brawl 專案
# 請以 root 或 sudo 執行
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_URL="https://github.com/lukwama/sokoban-brawl.git"
SWAP_SIZE_GB="${SWAP_SIZE_GB:-2}"
SWAP_FILE="/swapfile"
SWAPPINESS="${SWAPPINESS:-60}"
VM_SWAPPINESS_CONF="/etc/sysctl.d/99-swap-reserve.conf"

if [[ $EUID -ne 0 ]]; then
  echo "請使用 root 或 sudo 執行此腳本。"
  exit 1
fi

echo "===== 1. 虛擬記憶體 (swap) 設定 ====="
if [[ -f "$SWAP_FILE" ]]; then
  echo "已存在 $SWAP_FILE，跳過建立。若要重建請先: swapoff $SWAP_FILE && rm $SWAP_FILE"
else
  echo "建立 ${SWAP_SIZE_GB}GB swap 檔案..."
  fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024))
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE"
  swapon "$SWAP_FILE"
  if ! grep -q "^$SWAP_FILE " /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    echo "已寫入 /etc/fstab"
  fi
fi

# 可選：降低 swappiness，減少非必要時使用 swap（保留給真正記憶體不足時用）
echo "設定 swappiness=${SWAPPINESS} 並寫入 $VM_SWAPPINESS_CONF"
printf 'vm.swappiness=%s\n' "$SWAPPINESS" > "$VM_SWAPPINESS_CONF"
sysctl -p "$VM_SWAPPINESS_CONF" 2>/dev/null || true

echo ""
echo "===== 2. SSH 服務資源保護 (systemd) ====="
mkdir -p /etc/systemd/system/ssh.service.d
if [[ -f "$SCRIPT_DIR/ssh-resource-protection.conf" ]]; then
  cp "$SCRIPT_DIR/ssh-resource-protection.conf" /etc/systemd/system/ssh.service.d/override.conf
  echo "已安裝 ssh.service 資源保護"
fi
mkdir -p /etc/systemd/system/ssh.socket.d
if [[ -f "$SCRIPT_DIR/ssh-socket-protection.conf" ]]; then
  cp "$SCRIPT_DIR/ssh-socket-protection.conf" /etc/systemd/system/ssh.socket.d/override.conf
  echo "已安裝 ssh.socket 設定"
fi
systemctl daemon-reload
# 若目前是用 socket 觸發，重啟 socket 即可
systemctl restart ssh.socket 2>/dev/null || systemctl restart ssh 2>/dev/null || true
echo "SSH 設定已套用"

echo ""
echo "===== 3. fail2ban 防暴力破解 ====="
if ! command -v fail2ban-client &>/dev/null; then
  apt-get update -qq
  apt-get install -y fail2ban
  systemctl enable fail2ban
fi
if [[ -f "$SCRIPT_DIR/fail2ban-sshd.local" ]]; then
  mkdir -p /etc/fail2ban/jail.d
  cp "$SCRIPT_DIR/fail2ban-sshd.local" /etc/fail2ban/jail.d/sshd.local
  systemctl restart fail2ban
  echo "fail2ban sshd jail 已啟用"
fi
echo "目前封鎖名單: $(fail2ban-client status sshd 2>/dev/null | head -5 || echo '（尚未有封鎖）')"

echo ""
echo "===== 4. 拉取 sokoban-brawl 專案 ====="
CLONE_DIR="${CLONE_DIR:-/opt/sokoban-brawl}"
if [[ -d "$CLONE_DIR/.git" ]]; then
  echo "目錄已存在，執行 git pull..."
  (cd "$CLONE_DIR" && git fetch origin && git pull --rebase origin main)
else
  echo "克隆至 $CLONE_DIR ..."
  mkdir -p "$(dirname "$CLONE_DIR")"
  git clone --depth 1 "$REPO_URL" "$CLONE_DIR"
fi
echo "專案路徑: $CLONE_DIR"
ls -la "$CLONE_DIR"

echo ""
echo "===== 設定完成 ====="
echo "  - Swap: $(swapon --show 2>/dev/null | grep -oP '/\S+' || echo '未啟用')"
echo "  - SSH: systemd 已套用資源保護"
echo "  - fail2ban: sshd jail 已啟用"
echo "  - 專案: $CLONE_DIR"
echo "建議：以一般使用者測試 ssh 連線後再登出，確認 fail2ban 未誤封本機。"

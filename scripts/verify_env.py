#!/usr/bin/env python3
"""驗證 Python 虛擬環境與 SQLite 是否正常運作。"""
import sys

def main():
    print("Python 版本:", sys.version)
    print("Python 路徑:", sys.executable)

    # SQLite3 為 Python 內建模組，無需 pip install
    try:
        import sqlite3
        conn = sqlite3.connect(":memory:")
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)")
        conn.execute("INSERT INTO test VALUES (1)")
        row = conn.execute("SELECT * FROM test").fetchone()
        conn.close()
        assert row[0] == 1
        print("SQLite3: OK (內建模組，WAL 模式可用)")
    except Exception as e:
        print("SQLite3: 錯誤 -", e)
        return 1

    print("\n環境驗證完成。")
    return 0

if __name__ == "__main__":
    sys.exit(main())

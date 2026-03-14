#!/usr/bin/env node
/**
 * en_US (English)
 * Restore custom levels 57, 58, 59 to the original defaultXMLData from lukwama.com/sokoban
 * and ensure one leaderboard record per level (creator: lukwama). Use after DB drift or manual fix.
 *
 * zh_TW（繁體中文）
 * 將自訂關卡 57、58、59 還原為 lukwama.com/sokoban 的 defaultXMLData，
 * 並確保每關各有一筆排行榜記錄（上傳者：lukwama）。可用於 DB 偏離或手動修復後。
 */

import { initDb, insertCustomLevelWithId, insertRecord, hasDuplicateMoves } from '../server/db.js';
import { DEFAULT_CUSTOM_LEVELS, DEFAULT_CREATOR } from '../server/seedDefaultLevels.js';

async function main() {
  console.log('Restore defaultXMLData levels 57, 58, 59 (creator: lukwama)');
  console.log('還原 defaultXMLData 關卡 57、58、59（上傳者：lukwama）\n');

  await initDb();

  for (const level of DEFAULT_CUSTOM_LEVELS) {
    insertCustomLevelWithId(
      level.levelId,
      level.levelData,
      DEFAULT_CREATOR,
      level.solutionMoves,
      level.solutionSteps
    );
    console.log(`Level ${level.levelId} restored.`);

    const levelIdStr = String(level.levelId);
    if (!hasDuplicateMoves(levelIdStr, level.solutionMoves)) {
      insertRecord(levelIdStr, DEFAULT_CREATOR, level.solutionSteps, level.solutionMoves);
      console.log(`  Leaderboard record for level ${level.levelId} added.`);
    }
  }

  console.log('\nDone. Restart the server if it is running (e.g. sudo systemctl restart sokoban-brawl).');
  console.log('完成。若服務正在運行請重啟（例如 sudo systemctl restart sokoban-brawl）。');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

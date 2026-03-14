/**
 * en_US (English)
 * Default custom levels 57, 58, 59 from lukwama.com/sokoban defaultXMLData.
 * Seeded on first run so new clones get demo levels + leaderboard records (creator: lukwama).
 *
 * zh_TW（繁體中文）
 * 來自 lukwama.com/sokoban defaultXMLData 的預設自訂關卡 57、58、59。
 * 首次啟動時自動種入，讓新 clone 的開發者取得示範關卡與排行榜記錄（上傳者：lukwama）。
 */

import {
  getCustomLevelById,
  insertCustomLevelWithId,
  insertRecord,
  hasDuplicateMoves,
} from './db.js';

export const DEFAULT_CREATOR = 'lukwama';

/** Level definitions: levelData (trimmed), solutionMoves, solutionSteps */
export const DEFAULT_CUSTOM_LEVELS = [
  {
    levelId: 57,
    levelData: `??#####
??#  @#
??# $ #
??#$###
###  #?
#..  #?
######?`.trim(),
    solutionMoves: 'lrlldddrdllruuuurrdluldddrdl',
    solutionSteps: 28,
  },
  {
    levelId: 58,
    levelData: `#########
#       #
#       #
#   .   #
#       #
#   $ * #
#       #
#   @   #
#########`.trim(),
    solutionMoves: 'uuu',
    solutionSteps: 3,
  },
  {
    levelId: 59,
    levelData: `#######
#     #
# $@. #
#     #
#     #
#     #
#######`.trim(),
    solutionMoves:
      'udduudduudduudduudduuddrruullddlluurrdddrruuulldddlluuurrddddrruuuullddddlluuuurrrrddlluulldddrruuurrddddlllluuurr',
    solutionSteps: 114,
  },
];

/**
 * en_US: Seed default custom levels 57,58,59 and one leaderboard record each (lukwama) if level 57 is missing.
 * zh_TW: 若關卡 57 不存在，則種入預設自訂關卡 57、58、59 及各一筆排行榜記錄（lukwama）。
 */
export function seedDefaultCustomLevelsIfNeeded() {
  if (getCustomLevelById(57) !== null) return;

  for (const level of DEFAULT_CUSTOM_LEVELS) {
    insertCustomLevelWithId(
      level.levelId,
      level.levelData,
      DEFAULT_CREATOR,
      level.solutionMoves,
      level.solutionSteps
    );
    const levelIdStr = String(level.levelId);
    if (!hasDuplicateMoves(levelIdStr, level.solutionMoves)) {
      insertRecord(levelIdStr, DEFAULT_CREATOR, level.solutionSteps, level.solutionMoves);
    }
  }
}

import { applyMove } from './multiplayerEngine.js';

const DIRS = ['u', 'd', 'l', 'r'];

function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function cloneState(state) {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, pos: { ...p.pos } })),
    boxes: state.boxes.map((b) => ({ ...b, pos: { ...b.pos } })),
    targets: state.targets.map((t) => ({ ...t, pos: { ...t.pos } })),
    scores: { ...state.scores },
    firstScoreAt: { ...state.firstScoreAt },
  };
}

export function pickNpcMove(state, npcPlayer) {
  const ownBoxes = state.boxes.filter((b) => b.ownerSlot === npcPlayer.slotIndex);
  const ownTargets = state.targets.filter((t) => t.ownerSlot === npcPlayer.slotIndex);
  if (ownBoxes.length === 0 || ownTargets.length === 0) return DIRS[Math.floor(Math.random() * DIRS.length)];

  let best = null;
  for (const dir of DIRS) {
    const draft = cloneState(state);
    const changed = applyMove(draft, npcPlayer.id, dir);
    if (!changed) continue;
    const nextBoxes = draft.boxes.filter((b) => b.ownerSlot === npcPlayer.slotIndex);
    const cost = nextBoxes.reduce((sum, box) => {
      let best = Number.MAX_SAFE_INTEGER;
      for (const target of ownTargets) {
        const d = manhattan(box.pos, target.pos);
        if (d < best) best = d;
      }
      return sum + best;
    }, 0);
    const randomSalt = Math.random() * 0.05;
    const score = cost + randomSalt;
    if (!best || score < best.score) best = { dir, score };
  }
  if (best) return best.dir;
  return DIRS[Math.floor(Math.random() * DIRS.length)];
}

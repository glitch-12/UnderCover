import type { UndercoverVariantId } from './config';

// Tracks the variant used for the in-progress/most-recent game so "Play
// Again" from GameOver can reuse it without threading it through every
// screen's navigation params.
let lastVariantId: UndercoverVariantId = 'classic';

export function setLastVariantId(id: UndercoverVariantId): void {
  lastVariantId = id;
}

export function getLastVariantId(): UndercoverVariantId {
  return lastVariantId;
}

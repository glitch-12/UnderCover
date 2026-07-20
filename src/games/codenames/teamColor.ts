import type { ThemeColors } from '../../shared/theme';
import type { CardOwner } from './logic/generateBoard';

const BLUE_COLOR = '#3B82F6';
const ASSASSIN_COLOR = '#F2B84B';

// Fixed (theme-independent) accent for each card owner — Codenames teams are
// always red/blue by convention. The assassin uses a bright amber rather
// than the "obvious" black: on this app's dark theme, near-black borders
// disappear against the background, making the assassin indistinguishable
// from an unrevealed neutral card — exactly the card a Codemaster most needs
// to spot at a glance.
export function getOwnerColor(colors: ThemeColors, owner: CardOwner): string {
  switch (owner) {
    case 'red':
      return colors.danger;
    case 'blue':
      return BLUE_COLOR;
    case 'assassin':
      return ASSASSIN_COLOR;
    case 'neutral':
    default:
      return colors.textSecondary;
  }
}

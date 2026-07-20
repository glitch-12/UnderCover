import { RuleBook } from '../../../shared/components';

// Actual rule copy lives here (config-like content, not a screen-file
// literal) rather than in i18n, matching the precedent already set for
// Undercover's variant name/description strings — see
// docs/BUILD_LOG_MILESTONE_D.md's i18n scope-boundary note.
const SECTIONS = [
  {
    heading: 'Setup',
    body: 'Split into a Red team and a Blue team, at least 2 players each. Each team picks one Codemaster; everyone else is a Guesser. The board deals 25 word cards; one team starts with 9 of them, the other has 8, plus 7 neutral cards and 1 assassin.',
  },
  {
    heading: 'The key',
    body: "Only the Codemasters know which word belongs to which team — they see a hidden key showing every card's true owner before the round starts.",
  },
  {
    heading: 'Giving a clue',
    body: 'On your team\'s turn, your Codemaster gives one word plus a number, e.g. "Ocean, 3" — meaning 3 of the board words relate to "Ocean". The clue word can\'t be, or contain, any word currently on the board.',
  },
  {
    heading: 'Guessing',
    body: "Guessers tap words they think match the clue. Your own team's word keeps your turn going (up to the clue's number, plus one bonus guess). A neutral word or the other team's word ends your turn immediately.",
  },
  {
    heading: 'The assassin',
    body: 'One card is the assassin. Guess it and your team instantly loses the game — no matter how many cards you had left to find.',
  },
  {
    heading: 'Winning',
    body: "The first team to have all of their own words guessed wins. Guess every one of your team's cards before the other side finds theirs (or before your own team hits the assassin) to take the game.",
  },
];

export function CodenamesRules() {
  return <RuleBook title="Codenames" intro="Two teams race to find all of their own agents on the board using one-word clues." sections={SECTIONS} />;
}

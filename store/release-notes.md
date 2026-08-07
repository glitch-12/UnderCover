# Release Notes

## v1.0 (versionCode 1) — Initial Release

### Play Store "What's new" text (user-facing, ≤500 chars)

Use this in Play Console → Release → Release notes:

```
Welcome to Undercover! 🕵️

Pass-and-play social deduction for 3–20 players. Everyone gets a secret word except the Undercover, who gets a word that's almost — but not quite — the same. Give one-word clues, vote out who sounds suspicious, and see who's really undercover.

Three ways to play: Classic, Mr. White, and Multi-Undercover.

No sign-up, no internet needed — just pass the phone and play.
```
(316 characters — well under the 500 limit, room to add a second variant callout if you want it punchier.)

### Internal / technical changelog

First submitted build. Covers everything since the project's initial commit:

**Gameplay**
- Full Undercover game loop: lobby → role reveal → clue turns → discussion → vote → elimination → win check → game over
- Three variants: Classic (1 Undercover), Mr. White (blank-word wildcard with a steal-the-win guess), Multi-Undercover (Undercover count scales with table size)
- No-repeat word-pack deck (shuffle, draw without replacement, reshuffle excluding recently-drawn pairs) so games don't feel repetitive
- Dark-first theming with light mode, shared component/icon library
- i18n scaffolding (`react-i18next`) with English strings

**Release readiness (this pass)**
- Removed `react-native-google-mobile-ads` (AdMob) entirely — it was incompatible with the project's Kotlin toolchain and was breaking every Android build; not used in this release
- Kept Firebase Analytics (Google Analytics for Firebase) for basic usage analytics — disclosed in the privacy policy and Data Safety form
- Fixed a manifest merge conflict and a pre-existing TypeScript syntax error (`Home.tsx`) that were both silently blocking clean builds
- Generated Play Store assets: 512×512 hi-res icon, 1024×500 feature graphic, 8 real device screenshots, store listing copy, privacy policy, Data Safety answers
- Built and signed the first release App Bundle (`versionCode 1`, `versionName "1.0"`)

**Known gaps for future releases**
- No online/multiplayer mode yet — local pass-and-play only
- Only English word pack and UI strings currently
- No in-app way to request analytics data deletion beyond device-level Advertising ID reset

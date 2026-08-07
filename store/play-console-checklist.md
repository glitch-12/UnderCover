# Play Console: Data Safety + Pre-Submission Checklist

## Data Safety section answers (Play Console → App content → Data safety)

AdMob (`react-native-google-mobile-ads`) has been **removed from the app** — it was causing a Kotlin/Gradle version conflict that broke the Android build entirely (see "What changed" below). The app has no ad SDK, no backend, and no auth — but it does still bundle **Google Analytics for Firebase** (`com.google.firebase:firebase-analytics`, wired up in [android/app/build.gradle](../android/app/build.gradle) alongside Firebase App Distribution). This was a deliberate keep, not an oversight — flagged and confirmed before this build was produced.

As of `versionCode 5`, the `AD_ID` permission is explicitly **excluded** (`tools:node="remove"` in [AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml)), so Firebase Analytics cannot read the device's Advertising ID at all — no ad-ID attribution, no IP-derived approximate location tied to it.

**Does your app collect or share any of the required user data types?** → **Yes**, via Firebase Analytics only (no ad SDK, no Advertising ID).

| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| App interactions (opens, sessions) | Yes | Yes (with Google) | Analytics |
| Device or other IDs (Firebase install ID) | Yes | Yes | Analytics |
| Advertising ID | **No** (explicitly excluded from the manifest) | No | — |
| Approximate location | **No** | No | — |

All other categories (personal info, financial info, health, contacts, photos, precise location, messages, etc.) → **No**.

**Play Console's Advertising ID declaration** (App content → Advertising ID) should now be answered **"No, my app does not use advertising ID"** — matching the manifest. Do not answer "Yes" here for this build; the permission genuinely isn't present, and Play Console cross-checks the answer against the actual AAB.

- **Is data encrypted in transit?** Yes (standard for the Firebase SDK).
- **Can users request data deletion?** Not via an in-app flow today — there's no account, so nothing to delete server-side beyond what Firebase's own data controls offer.
- **Is data collection required or optional?** Optional from the user's perspective — analytics is not required for gameplay.

This mirrors [privacy-policy.md](privacy-policy.md), which discloses Firebase Analytics explicitly and no longer mentions Advertising ID collection. If you add AdMob back, crash reporting, or IAP later, update both this checklist and the privacy policy, and re-test the Android release build for the Kotlin metadata-version conflict noted below (that conflict was specific to `react-native-google-mobile-ads`, not Firebase Analytics).

## What changed in this session

- Found `AndroidManifest.xml` had an uncommitted, half-finished AdMob change that broke every Android build (`processDebugMainManifest` merge conflict — missing `tools:replace`). Fixed the manifest, which then surfaced a deeper issue.
- Google's current `play-services-ads` (via `react-native-google-mobile-ads@16.4.0`) is compiled with Kotlin metadata 2.3.0, incompatible with this project's Kotlin 2.1.20 toolchain. Bumping Kotlin alone cascaded into failures in `react-native-safe-area-context` and `react-native-gesture-handler`, so the real fix would be a coordinated dependency/toolchain upgrade.
- Per your instruction, removed AdMob entirely instead: uninstalled `react-native-google-mobile-ads`, stripped the `BannerAd` from [Home.tsx](../src/app/screens/Home.tsx), removed `mobileAds().initialize()` from [App.tsx](../src/app/App.tsx), removed the `GADApplicationIdentifier`/`SKAdNetworkItems` block from [Info.plist](../ios/UnderCover/Info.plist), removed the AdMob `meta-data` from [AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml), and re-ran `pod install`/`npm uninstall`. Android now builds clean (`BUILD SUCCESSFUL`) and iOS builds clean.
- Also fixed a pre-existing syntax error in [Home.tsx](../src/app/screens/Home.tsx) (`styles.card` had a stray unclosed brace wrapping `styles.listCard`, breaking `tsc` entirely) — that error predates this session's AdMob work.
- If you want ads back in the future, budget time to upgrade Kotlin/AGP/RN together rather than dropping in the current `react-native-google-mobile-ads` cold.

## Content rating questionnaire (IARC)

Answer honestly based on gameplay: word-guessing party game, no violence, no user-generated content shared publicly, no chat/messaging, no gambling, no in-app purchases currently. Expect a rating around **PEGI 3 / Everyone**. Select "party game / social deduction" as the closest category if asked.

## Target audience & content

- Target age group: 13+ recommended (not designed or marketed to children). With Advertising ID excluded, there's no ad-ID-related restriction to worry about even if you later target a younger audience — Firebase Analytics still collects basic app-interaction data either way, which is unaffected by the Families policy tier.

## Store listing assets already generated (in `store/`)

- `graphics/hires_icon_512.png` — 512×512 hi-res icon
- `graphics/feature_graphic_1024x500.png` — 1024×500 feature graphic
- `screenshots/*.png` — phone screenshots captured from a real Pixel 8 emulator (portrait, 1080px wide)
- `listing.md` — app title, short description, full description
- `privacy-policy.md` — privacy policy draft

## Still needed before you can submit

1. **Host the privacy policy at a public URL.** Play Console requires a live URL, not a file. Easiest options: GitHub Pages (push `store/privacy-policy.md` to a `gh-pages` branch or a public repo's `docs/` folder), or Notion/Google Sites. I can help wire up GitHub Pages if you want.
2. **Bump `versionCode`/`versionName`** in [android/app/build.gradle](android/app/build.gradle) — currently `versionCode 1` / `versionName "1.0"`, fine for a first upload but you'll need to increment on every subsequent release.
3. **Build and upload a signed release AAB** (`android/app/undercover-release.keystore` already exists per prior signing setup) — run `./gradlew bundleRelease` from `android/`, then upload the `.aab` to Play Console.
4. **Fill in Play Console's App content section**: Data safety (table above), content rating questionnaire (above), target audience, ads declaration ("No, does not contain ads"), Advertising ID declaration ("No, does not use advertising ID" — matches `versionCode 5`'s manifest), and government apps / news apps declarations (both "No").
5. **Add a support email/website** in the Store listing — `vaibhavisharma.rlb@gmail.com` is used as the placeholder contact in the generated listing copy; swap if you'd rather use a different address.
6. **Decide on monetization.** The app currently has no ad SDK and no revenue path. If you want ads back, budget time for a coordinated Kotlin/AGP/RN dependency upgrade first (see "What changed" above) rather than re-adding `react-native-google-mobile-ads` cold.

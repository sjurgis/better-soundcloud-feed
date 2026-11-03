<p align="center">
  <img src="public/icon.svg" width="128" height="128" alt="Better SoundCloud Feed">
</p>

# Better SoundCloud Feed

Chrome/Edge/Firefox/Safari extension (Manifest V3) that filters your SoundCloud feed and adds extra playback controls.

## Install

- **[Chrome Web Store](https://chromewebstore.google.com/detail/better-soundcloud-feed/jgpocikbldihefbcpbekiknmhoghfiel)**
- **[Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/better-soundcloud-feed/)**
- **[Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/better-soundcloud-feed/hjmcmheeineemhcfpccgkfiicpchbaif)**

Or build it from source:

## Build from source

```bash
pnpm install
pnpm build
```

Then load the extension in your browser:

**Chrome/Edge:**

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder

**Firefox:**

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `dist/manifest.json`

**Safari (macOS):**

Safari needs the extension wrapped in a small macOS app. On a Mac with Xcode (or the Command Line Tools) installed:

```bash
pnpm install
pnpm build:safari:swiftc   # pnpm build + swiftc + ad-hoc codesign, no Xcode project needed
cp -R "safari/manual/Better SoundCloud Feed.app" ~/Applications/
open ~/Applications/"Better SoundCloud Feed.app"   # registers the extension with Safari
```

Alternatively `pnpm build:safari` generates a full Xcode project with Apple's `safari-web-extension-converter` and builds it with `xcodebuild` (output in `safari/build/Build/Products/Release/`). That needs a fully set-up Xcode; if the converter says "A required plugin failed to load", open Xcode once (or run `xcodebuild -runFirstLaunch`) to install its components.

Then in Safari (17+; Safari 18+ recommended, since earlier versions ignore `world: "MAIN"` and fall back to a slower `<script>` tag injection):

1. **Safari > Settings > Advanced** — tick **Show features for web developers**
2. **Develop > Allow Unsigned Extensions** (asks for your Mac password; Safari turns this off again every time it quits, so repeat after restarting Safari)
3. **Safari > Settings > Extensions** — tick **Better SoundCloud Feed**
4. Open [soundcloud.com](https://soundcloud.com/), click the extension's toolbar icon (or the puzzle-piece/permission prompt) and choose **Always Allow on This Website**, then reload the page

To avoid step 2 on every launch, run `SKIP_XCODEBUILD=1 pnpm build:safari`, open `safari/Better SoundCloud Feed/Better SoundCloud Feed.xcodeproj` in Xcode, set **Signing & Capabilities > Team** to your (free) personal team for both targets, and build/run from Xcode.

Safari limitations: Document Picture-in-Picture is not available in Safari, so the PiP button and settings are hidden/disabled. Filters, seek buttons and settings work the same as in Chrome.

Navigate to [soundcloud.com](https://soundcloud.com/) — a filter bar appears above your feed, and extension controls appear in the player bar.

## Development

```bash
pnpm dev          # Build in watch mode
pnpm build        # Production build
pnpm build:safari:swiftc # Safari app via swiftc (macOS only)
pnpm build:safari        # Safari app via Xcode project (macOS only)
pnpm test         # Unit tests (Vitest)
pnpm check        # Lint (Oxlint) + format check (Oxfmt)
pnpm typecheck    # TypeScript strict mode
pnpm check:unused # Dead code detection (Knip)
```

After rebuilds, reload the extension in the browser to pick up changes.

## Features

### Filters

The filter panel appears on your **feed** (`/feed`) and on **tag pages** (`/tags/<tag>` — both the _Recent Tracks_ and _Popular Tracks_ tabs; the _Playlists_ tab is left alone). Feed and tag pages remember their own filters.

| Filter                | Behavior                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Activity types**    | Feed only. Checkboxes for track posts, track reposts, and playlist posts. Controls the `activityTypes` query param at the API level — unchecked types are never fetched.                                                                                                                                                                                                                                                |
| **Search (simple)**   | Single input matching against all fields (title, description, genre, artist, label). "Search in" checkboxes let you leave fields out, e.g. untick Description to avoid matches on promo text. Nothing ticked = search ignored.                                                                                                                                                                                          |
| **Search (extended)** | Per-field inputs: title, description, genre, artist, label. Only non-empty fields are checked. Artist covers the uploader, the displayed release artist and (feed only) the reposter. Switch modes with the Simple / Extended toggle in the Search row.                                                                                                                                                                 |
| **Search syntax**     | Comma-separated terms, `-exclude` prefix, `*wildcard` globs, case-insensitive. AND/OR operator toggle.                                                                                                                                                                                                                                                                                                                  |
| **Duration**          | Min/max in minutes. Applies to tracks only (not playlist totals). On _Popular Tracks_, a range that fits one of SoundCloud's length buckets (<2, 2–10, 10–30, >30 min) is also applied server-side.                                                                                                                                                                                                                     |
| **Date**              | Under _More filters_. From/to calendar days via your browser's date picker, matched against the date SoundCloud shows on the track (its release date). On the feed ("Date") an item passes if either its post/repost time or that date is in range; on tag pages ("Uploaded") it's that date alone. On _Popular Tracks_ a set _From_ is also applied server-side via SoundCloud's past hour/day/week/month/year filter. |
| **Likes / Plays**     | Under _More filters_. Min/max like and play counts, applied locally on every page. For playlist posts, likes use the playlist's own count and plays are checked per track.                                                                                                                                                                                                                                              |
| **Followers**         | Under _More filters_. Min/max follower count; passes if either the track's uploader or whoever reposted it is in range (the playlist owner or poster for playlist posts). Applied locally on every page.                                                                                                                                                                                                                |

One rule for every filter: when an item has several sources for the same kind of value (uploader, reposter and release-artist names; post time and upload date; uploader's and reposter's followers), any one of them satisfying the filter is enough. Date, likes, plays and followers live under a collapsible **More filters** toggle whose open state is remembered; filters set inside still apply while it's collapsed, and a badge on the toggle counts them. Changes take effect when you click **Apply & Reload**. While a locally applied filter is active, pages are requested at twice SoundCloud's usual size so they don't come back nearly empty after filtering. Sorting isn't offered: SoundCloud's API has no sort options on these pages.

### Player Controls

| Control             | Behavior                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Settings button** | Gear icon in the player bar — opens extension settings dialog.                                     |
| **PiP button**      | Toggles the Picture-in-Picture window open/closed. Enabled by default; can be hidden in settings.  |
| **Seek forward**    | Seeks forward by configurable seconds (default 30), or skips to next track if near the end.        |
| **Seek backward**   | Seeks backward by configurable seconds (default 30), or skips to previous track if near the start. |

Seek and PiP buttons are enabled by default. Toggle and customize them in extension settings. Player controls appear greyed out until the player API is discovered, then become active.

### Picture-in-Picture

When you switch away from the SoundCloud tab, an always-on-top mini player appears with:

- Track title (clickable — opens track page) and artist name (clickable — opens profile)
- Cover artwork
- Waveform progress bar (clickable to seek)
- Full transport controls: seek backward/forward, skip prev/next, play/pause
- Like/unlike button (synced with SoundCloud)
- Current time and total duration

Requires Chrome 116+ or Edge 116+. Firefox 148+ supports it with `dom.documentpip.enabled` enabled in `about:config`. Not available in Safari.

Configure PiP behaviour in extension settings:

- **Auto-open PiP on tab switch** — enabled by default; browser manages the lifecycle (opens on tab leave, closes on tab return)
- **Show PiP button in player** — manually toggle PiP open/closed from the player bar; enabled by default; manual PiP stays open until you close it

## License

[MIT](LICENSE)

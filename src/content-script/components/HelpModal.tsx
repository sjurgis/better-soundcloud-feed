import { Modal, mountModal } from "./Modal";
import { ISSUES_URL } from "../../shared/constants";

const HELP_MODAL_ID = "scf-help-modal";

function HelpModalContent({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Better SC Feed Help" onClose={onClose}>
      <h2>Filters</h2>

      <section class="scf-modal-section">
        <h3>Where Filters Work</h3>
        <ul>
          <li>
            <strong>Your feed</strong> (<code>/feed</code>) — the full set of filters below
          </li>
          <li>
            <strong>Tag pages</strong> (<code>/tags/…</code>) — the <em>Recent Tracks</em> and{" "}
            <em>Popular Tracks</em> tabs get the same panel minus activity types (those pages only
            list tracks). The <em>Playlists</em> tab is left untouched.
          </li>
        </ul>
        <p>
          The feed and tag pages remember <strong>separate</strong> filters, so pruning your feed
          never changes how you dig through a tag. Sorting isn&apos;t offered because
          SoundCloud&apos;s API has no sort options on these pages.
        </p>
        <p>
          One rule for every filter: when an item offers the same kind of value from several sources
          — the uploader&apos;s, reposter&apos;s and release artist&apos;s names, the post time and
          the upload date, the uploader&apos;s and the reposter&apos;s followers — it is enough for{" "}
          <em>any one</em> of them to satisfy the filter.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Activity Types</h3>
        <p>Feed only. Toggle which types of feed items to show:</p>
        <ul>
          <li>
            <strong>Tracks</strong> — original track posts
          </li>
          <li>
            <strong>Reposts</strong> — tracks reposted by people you follow
          </li>
          <li>
            <strong>Playlists</strong> — playlist posts and reposts
          </li>
        </ul>
        <p>These filter at the API level, so unchecked types are never fetched.</p>
      </section>

      <section class="scf-modal-section">
        <h3>Search</h3>
        <p>
          Search works in two modes, <strong>Simple</strong> and <strong>Extended</strong>, switched
          with the toggle at the start of the Search row.
        </p>

        <h4>Simple Mode</h4>
        <p>
          A single search box that matches against all fields (title, description, genre, artist,
          label). Use the <strong>Search in</strong> checkboxes below the box to leave fields out —
          for example, untick Description so a track isn&apos;t matched just because its promo text
          mentions a genre. With All selected, each term still only needs to appear in any one of
          the ticked fields. If nothing is ticked, the search is ignored.
        </p>

        <h4>Extended Mode</h4>
        <p>
          Separate inputs for each field: Title, Description, Genre, Artist, and Label. Only
          non-empty fields are used.
        </p>
        <p>
          In both modes, <strong>Artist</strong> covers the uploader, the release artist SoundCloud
          shows on the track (which can differ from the uploader, e.g. on label accounts) and, on
          the feed, the reposter.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Search Syntax</h3>
        <p>Both modes support the same syntax in each input:</p>
        <ul>
          <li>
            <strong>Comma-separated terms</strong> — <code>garage, house, techno</code> searches for
            three separate terms
          </li>
          <li>
            <strong>
              Exclude with <code>-</code>
            </strong>{" "}
            — <code>-remix, -edit</code> hides items matching those terms
          </li>
          <li>
            <strong>
              Wildcards with <code>*</code>
            </strong>{" "}
            — <code>epic*house</code> matches "epic deep house", "epic warehouse", etc.
          </li>
          <li>
            All matching is <strong>case-insensitive</strong>
          </li>
          <li>Empty inputs match everything</li>
        </ul>
      </section>

      <section class="scf-modal-section">
        <h3>All / Any Toggle</h3>
        <p>
          Controls how <em>include</em> terms combine:
        </p>
        <ul>
          <li>
            <strong>All</strong> (AND) — every include term must match
          </li>
          <li>
            <strong>Any</strong> (OR) — at least one include term must match
          </li>
        </ul>
        <p>Exclude terms always reject on any match, regardless of this setting.</p>
        <p>
          In <strong>Extended Mode</strong>, this also controls how non-empty fields relate to each
          other.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Duration</h3>
        <p>
          Filter tracks by length in minutes. Set a minimum, maximum, or both. Applies only to
          tracks (not playlists).
        </p>
        <p>
          On the <em>Popular Tracks</em> tab, a range that fits one of SoundCloud&apos;s own length
          buckets (under 2, 2–10, 10–30, over 30 minutes) is also applied server-side, so fewer
          unwanted tracks are loaded in the first place. Your exact range is still enforced.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Date</h3>
        <p>
          A from/to range of calendar days (both inclusive; either can be left empty), picked with
          your browser&apos;s date picker.
        </p>
        <ul>
          <li>
            On the feed (row labelled <strong>Date</strong>) an item passes if <em>either</em> the
            time it was posted or reposted <em>or</em> the date SoundCloud shows on the track (its
            release date) falls in the range. So a fresh repost of an old track counts as recent,
            and it also counts as old.
          </li>
          <li>
            On tag pages (labelled <strong>Uploaded</strong>) it is the date shown on the track —
            the same &quot;posted 2 days ago&quot; you see in the list, so the filter always agrees
            with what is displayed.
          </li>
        </ul>
        <p>
          On the <em>Popular Tracks</em> tab a set <em>From</em> date is also applied server-side
          via SoundCloud&apos;s &quot;added in the past hour / day / week / month / year&quot;
          filter; the exact range is still enforced afterwards.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Likes, Plays &amp; Followers</h3>
        <p>
          Minimum and/or maximum like and play counts, and the uploader&apos;s follower count. A
          maximum is handy for surfacing under-the-radar tracks and artists. Applied locally on
          every page.
        </p>
        <p>
          Followers passes if <em>either</em> the uploader <em>or</em> whoever reposted the item has
          a follower count in range. For playlist posts on the feed, likes use the playlist&apos;s
          own count, followers use the owner or the poster, and plays are checked per track — the
          playlist passes if any of its tracks does.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Page Size</h3>
        <p>
          Whenever a locally applied filter is active, the extension asks SoundCloud for twice its
          usual page size so filtered pages don&apos;t come back nearly empty.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Actions</h3>
        <ul>
          <li>
            <strong>Apply &amp; Reload</strong> — saves the filters for this page and reloads it so
            every loaded item respects them
          </li>
          <li>
            <strong>Clear</strong> — resets the panel to defaults (nothing is saved until you click
            Apply &amp; Reload)
          </li>
        </ul>
      </section>

      <h2>Playback</h2>

      <section class="scf-modal-section">
        <h3>Seek Forward / Backward</h3>
        <p>
          Two buttons in the player bar that jump forward or backward in the current track by a
          configurable number of seconds (default 30).
        </p>
        <p>
          If seeking forward would land past 90% of the track, it plays the next track. If seeking
          backward would land before 10%, it plays the previous track.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Playback Settings</h3>
        <p>Click the gear icon in the player bar to open the settings modal:</p>
        <ul>
          <li>
            <strong>Enable Seek Buttons</strong> — show or hide the seek buttons in the player bar
          </li>
          <li>
            <strong>Seconds to seek</strong> — how far each seek button jumps (1–300 seconds)
          </li>
          <li>
            <strong>Auto-open PiP on tab switch</strong> — open the mini player automatically when
            you leave the SoundCloud tab
          </li>
          <li>
            <strong>Show PiP button in player</strong> — show or hide the PiP toggle button in the
            player bar
          </li>
        </ul>
        <p>
          Click <strong>Apply</strong> to save, <strong>Reset</strong> to restore defaults, or{" "}
          <strong>Cancel</strong> to discard changes.
        </p>
      </section>

      <h2>Picture-in-Picture</h2>

      <section class="scf-modal-section">
        <h3>PiP Player</h3>
        <p>
          An always-on-top mini player that floats above all other windows. Two ways to open it:
        </p>
        <ul>
          <li>
            <strong>Auto mode</strong> — opens automatically when you switch away from the
            SoundCloud tab (enabled by default, toggle in settings)
          </li>
          <li>
            <strong>Manual button</strong> — click the PiP button in the player bar to open or close
            it at any time (enabled by default, toggle in settings)
          </li>
        </ul>
        <p>The PiP window includes:</p>
        <ul>
          <li>
            <strong>Track title</strong> — click to open the track page in a new tab
          </li>
          <li>
            <strong>Artist name</strong> — click to open the artist's profile
          </li>
          <li>
            <strong>Like button</strong> — heart icon next to the title, synced with SoundCloud
          </li>
          <li>
            <strong>Cover artwork</strong>
          </li>
          <li>
            <strong>Waveform</strong> — click anywhere to seek to that position
          </li>
          <li>
            <strong>Transport controls</strong> — seek backward/forward, skip prev/next, play/pause
          </li>
          <li>
            <strong>Time display</strong> — current position and total duration
          </li>
        </ul>
        <p>
          In auto mode, the browser manages the PiP lifecycle — it opens when you leave the tab and
          closes when you return. Manual PiP stays open until you close it yourself.
        </p>
      </section>

      <section class="scf-modal-section">
        <h3>Browser Support</h3>
        <ul>
          <li>
            <strong>Chrome / Edge 116+</strong> — supported out of the box
          </li>
          <li>
            <strong>Firefox 148+</strong> — requires enabling <code>dom.documentpip.enabled</code>{" "}
            in <code>about:config</code>
          </li>
          <li>
            <strong>Safari</strong> — not supported (no Document PiP API); the PiP button is hidden
          </li>
        </ul>
        <p>
          Configure PiP in the <strong>Playback Settings</strong> dialog (gear icon). All PiP
          toggles are disabled if your browser doesn't support Document PiP.
        </p>
      </section>

      <h2>Feedback &amp; Bug Reports</h2>

      <section class="scf-modal-section">
        <p>
          Found a bug or have a feature request? Please file an issue on GitHub:{" "}
          <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
            {ISSUES_URL}
          </a>
          .
        </p>
        <p>
          You can also click the bug icon next to the <strong>?</strong> button in the filter bar to
          open the issues page directly.
        </p>
      </section>
    </Modal>
  );
}

export function openHelpModal(): void {
  mountModal(HELP_MODAL_ID, (close) => <HelpModalContent onClose={close} />);
}

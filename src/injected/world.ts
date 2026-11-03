/**
 * Runtime detection of which JS world this bundle landed in.
 *
 * `injected.js` is declared in manifest.json as a `world: "MAIN"` content script
 * so it runs in the page context synchronously at document_start, before any SC
 * script. Browsers that predate that manifest key (Chrome/Edge < 111,
 * Firefox < 128) ignore it and run the file as a regular isolated-world content
 * script instead, where patching `fetch` has no effect on the page.
 *
 * Isolated worlds always expose the extension API with a runtime id. The page
 * world never does: Chrome exposes a bare `chrome` object (and, for
 * externally-connectable pages, a `chrome.runtime` without `id`), Firefox
 * exposes nothing.
 */

interface MaybeExtensionRuntime {
  runtime?: { id?: unknown; getURL?: (path: string) => string };
}

interface MaybeExtensionGlobal {
  chrome?: MaybeExtensionRuntime;
  browser?: MaybeExtensionRuntime;
}

/**
 * The extension API namespace for this world, if any. Chrome exposes `chrome`,
 * Firefox exposes both, and Safari exposes `browser` (with `chrome` as an
 * alias in most versions), so check both.
 */
function extensionApi(): MaybeExtensionRuntime | undefined {
  const g = globalThis as MaybeExtensionGlobal;
  if (typeof g.browser?.runtime?.id === "string") return g.browser;
  if (typeof g.chrome?.runtime?.id === "string") return g.chrome;
  return undefined;
}

/** True when running as an isolated-world content script rather than in the page. */
export function isIsolatedWorld(): boolean {
  return extensionApi() !== undefined;
}

/**
 * Legacy fallback: load `injected.js` into the page through a `<script>` tag.
 *
 * Dynamically inserted scripts are async, so this can lose the race against SC's
 * first `/stream` request on fast machines. It is only used when the main-world
 * content script path is unavailable. Requires `injected.js` to be listed in
 * `web_accessible_resources`.
 */
export function injectViaScriptTag(doc: Document = document): HTMLScriptElement {
  const script = doc.createElement("script");
  const getURL = extensionApi()?.runtime?.getURL ?? chrome.runtime.getURL;
  script.src = getURL("injected.js");
  script.onload = () => script.remove();
  (doc.head ?? doc.documentElement).prepend(script);
  return script;
}

/** How the page-world copy of injected.js was loaded. */
export type LoadStyle = "main-world-content-script" | "script-tag-fallback";

/**
 * Detect how this page-world copy was loaded, for diagnostics.
 *
 * A classic `<script>` element exposes itself as `document.currentScript`
 * while it executes. Content scripts (any world) are not run through a script
 * element, so `currentScript` is null for them.
 */
export function detectLoadStyle(doc: Document = document): LoadStyle {
  return doc.currentScript ? "script-tag-fallback" : "main-world-content-script";
}

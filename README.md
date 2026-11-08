# Local Google Fonts

Firefox extension that intercepts selected Google Fonts and related asset requests and serves bundled local copies instead. Sites keep working; those assets stop contacting Google’s font CDNs.

## What it replaces

| Remote request | Local substitute |
| --- | --- |
| `fonts.googleapis.com` CSS for **Material Symbols Outlined** | `fonts/material-symbols.css` |
| `fonts.gstatic.com/s/materialsymbolsoutlined/…` font files | `fonts/MaterialSymbolsOutlined.ttf` |
| YouTube outline experimental SVGs (`search`, `mic`, `add`, `bell`) on `fonts.gstatic.com` | Matching files in `icons/` |

Other Google Fonts families and unrelated `fonts.gstatic.com` URLs are left alone.

## Why

Loading fonts or icons from Google can expose browsing activity (which sites you visit, when, and which assets they request). Serving a local copy removes that network hop for the assets this extension covers.

## Install (temporary / development)

Firefox does not need a signed build for local testing:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select this project’s `manifest.json`.

The add-on stays loaded until Firefox restarts. Reload it from the same page after you change files.

### Permanent install (optional)

To keep it across restarts, package and sign it (for example with [`web-ext`](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) and Mozilla’s signing flow), or use a self-distribution method you already trust. The extension ID in `manifest.json` is currently `local-google-fonts@example.org` — change that before publishing.

## How it works

`background.js` registers blocking `webRequest.onBeforeRequest` listeners for:

- `https://fonts.googleapis.com/*`
- `https://fonts.gstatic.com/*`
- `https://fonts.gstatic.com/s/i/youtube_outline_experimental/*`

When a request matches a supported Material Symbols or YouTube icon path, the listener returns a `redirectUrl` pointing at a file packaged with the extension (`browser.runtime.getURL(...)`). Those files are listed under `web_accessible_resources` in `manifest.json`.

This uses **Manifest V2** with `webRequest` + `webRequestBlocking`, which is the practical way to redirect these requests in Firefox today.

## Permissions

| Permission | Reason |
| --- | --- |
| `webRequest` / `webRequestBlocking` | Inspect and redirect matching requests before they leave the browser |
| `<all_urls>` | Google Fonts URLs can be requested from any site |

The extension does not read page content and does not send data anywhere; it only short-circuits selected outbound font/icon requests.

## Project layout

```
local-google-fonts/
├── manifest.json              # Extension metadata and permissions
├── background.js              # Request matching and redirects
├── fonts/
│   ├── material-symbols.css   # Local @font-face for Material Symbols
│   └── MaterialSymbolsOutlined.ttf
└── icons/
    ├── search.svg
    ├── mic.svg
    ├── add.svg
    └── bell.svg
```

## Extending coverage

**Another Material Symbols / Google Fonts family**

1. Add the font file (and a small CSS `@font-face` if needed) under `fonts/`.
2. List new paths in `web_accessible_resources`.
3. Teach the first listener in `background.js` when to redirect (hostname + `family=` query or gstatic path).

**Another YouTube outline icon**

1. Drop an SVG into `icons/`.
2. Add its experimental name → filename entry to the `youtubeIcons` map in `background.js`.
3. Ensure `icons/*.svg` remains in `web_accessible_resources` (already covered by the glob).

## Verify

1. Load the temporary add-on.
2. Open a site that pulls Material Symbols from Google Fonts (or YouTube for the mapped icons).
3. In Firefox DevTools → Network, confirm matching requests redirect to `moz-extension://…` URLs instead of `fonts.googleapis.com` / `fonts.gstatic.com`.
4. Optional: filter the Browser Console for `Local YouTube icon:` when testing the YouTube SVG redirects.

## Limitations

- Only the assets listed above are localized; other trackers, analytics, and Google Fonts families still load remotely unless you extend the listeners.
- Temporary add-ons unload on browser restart.
- The bundled Material Symbols TTF is large (~11 MB); that is expected for a full local glyph set.
- Icon substitutes are Lucide-style outlines and may not be pixel-identical to YouTube’s originals.

## Third-party assets

Extension code and docs are under the [MIT License](LICENSE). Bundled third-party assets keep their own terms:

- **Material Symbols Outlined** — [Google Fonts / Material Symbols](https://fonts.google.com/icons), typically Apache License 2.0. Keep Google’s license/notice with redistributed font files if you publish this project.
- **YouTube replacement icons** — Lucide-style SVGs in `icons/` (ISC License for [Lucide](https://lucide.dev/)).

## Privacy

With the extension loaded, covered font and icon requests are answered from disk inside the extension package. Uncovered remote resources behave as usual.

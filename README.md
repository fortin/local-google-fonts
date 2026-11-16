# Local Google Fonts

Firefox extension that serves bundled copies of Material Symbols and selected YouTube icons. Sites keep working; those assets stop contacting Google’s font CDNs.

## What it replaces

| Remote request | Local substitute |
| --- | --- |
| `fonts.googleapis.com` CSS for **Material Symbols Outlined** | `fonts/material-symbols.css` |
| `fonts.gstatic.com/s/materialsymbolsoutlined/…` font files | `fonts/MaterialSymbolsOutlined.ttf` |
| YouTube and YouTube Studio experimental icons used as CSS masks (`youtube_outline_experimental` and `youtube_fill_experimental` on `fonts.gstatic.com`) | Matching files in `icons/`, when `content.js` knows that icon |

Other Google Fonts families, icons that are not in the map, and unrelated `fonts.gstatic.com` URLs are left alone.

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

Two mechanisms, because the two kinds of assets are requested differently.

**Fonts.** `background.js` registers a blocking `webRequest.onBeforeRequest` listener for:

- `https://fonts.googleapis.com/*`
- `https://fonts.gstatic.com/*`

When a request is the Material Symbols Outlined stylesheet or a file under `/s/materialsymbolsoutlined/`, the listener returns a `redirectUrl` from `browser.runtime.getURL(...)`. This uses **Manifest V2** with `webRequest` + `webRequestBlocking`, which is the practical way to redirect these requests in Firefox today. Host permission is on the font CDN URLs, so the redirect applies to any page that requests those files.

**Icons.** YouTube and YouTube Studio paint these glyphs with CSS `mask` / `-webkit-mask` on inline styles. `content.js` runs on `youtube.com` and `studio.youtube.com`, rewrites those mask URLs to the packaged SVGs, and watches the DOM for icons YouTube adds later. Rewriting the declaration keeps YouTube’s mask position, repeat, and size. The old background redirect for `youtube_outline_experimental` is gone; fill icons and Studio glyphs were not covered by it.

Mapped icons resolve in this order:

1. `legacyIcons` in `content.js` — older filenames that do not match the download names: `search.svg`, `mic.svg`, `add.svg`, `bell.svg`, and `heart.svg`.
2. `bundledIcons` — `icons/<style>-<name>.svg`, such as `outline-gear.svg` or `fill-dashboard.svg`.

Both the font files and `icons/*.svg` are listed under `web_accessible_resources` in `manifest.json`.

## Permissions

| Permission | Reason |
| --- | --- |
| `webRequest` / `webRequestBlocking` | Redirect Material Symbols CSS and font files before the request leaves the browser |
| `https://fonts.googleapis.com/*` | Intercept the stylesheet host |
| `https://fonts.gstatic.com/*` | Intercept the font-file host |
| `https://www.youtube.com/*`, `https://studio.youtube.com/*` | Run the content script that rewrites icon masks |

The content script reads inline `style` attributes on YouTube and YouTube Studio and rewrites icon mask URLs. It does not send page data anywhere. The font redirect does not read page content.

## Project layout

```
local-google-fonts/
├── manifest.json              # Extension metadata, permissions, content script
├── background.js              # Material Symbols request redirects
├── content.js                 # YouTube / Studio icon mask rewrites
├── script.sh                  # Downloads experimental YouTube SVGs into icons/
├── fonts/
│   ├── material-symbols.css   # Local @font-face for Material Symbols
│   └── MaterialSymbolsOutlined.ttf
└── icons/
    ├── search.svg             # Legacy stand-ins (also mic, add, bell, heart)
    ├── outline-search.svg     # Downloaded glyphs, named <style>-<name>.svg
    └── fill-dashboard.svg
```

## Extending coverage

**Another Material Symbols / Google Fonts family**

1. Add the font file (and a small CSS `@font-face` if needed) under `fonts/`.
2. List new paths in `web_accessible_resources`.
3. Teach the listener in `background.js` when to redirect (hostname + `family=` query or gstatic path).
4. Add a host permission if the files are served from a new origin.

**Another YouTube or Studio icon**

1. Add a `style/name/version` entry to `script.sh` and run it, or save the SVG yourself as `icons/<style>-<name>.svg`.
2. Add `"<style>-<name>"` to `bundledIcons` in `content.js`. Use `legacyIcons` only when the filename does not follow that pattern.
3. `icons/*.svg` is already covered by `web_accessible_resources`.

Add the set entry only after the file exists. A name in `bundledIcons` with no SVG is still rewritten, and the icon then fails to load. `content.js` currently lists some Studio names that are not in `icons/` yet.

## Verify

1. Load the temporary add-on.
2. Open a site that pulls Material Symbols from Google Fonts. In Firefox DevTools → Network, confirm the stylesheet and font file redirect to `moz-extension://…` instead of `fonts.googleapis.com` / `fonts.gstatic.com`.
3. Open YouTube or YouTube Studio. Mapped icon masks should request `moz-extension://…/icons/….svg`. The page console logs `[Local Icons] Active on` plus the hostname.
4. Optional: set `DEBUG` to `true` in `content.js` and reload the add-on to log each replacement and any icon name that is not mapped.

## Limitations

- Only Material Symbols Outlined is localized. Other Google Fonts families still load remotely.
- Icon replacement runs only on YouTube and YouTube Studio, and only for inline `mask` / `-webkit-mask` styles. Icons requested any other way, or from other sites, are untouched.
- Icon names that are not in `legacyIcons` or `bundledIcons` still load from `fonts.gstatic.com`.
- A few names in `bundledIcons` do not have a file in `icons/` yet. Those masks are pointed at a missing extension URL.
- Temporary add-ons unload on browser restart.
- The bundled Material Symbols TTF is large (~11 MB); that is expected for a full local glyph set.
- `search.svg`, `mic.svg`, `add.svg`, `bell.svg`, and `heart.svg` are stand-ins and may not match YouTube’s originals. The `<style>-<name>.svg` files are copies of the experimental SVGs.

## Third-party assets

Extension code and docs are under the [MIT License](LICENSE). Bundled third-party assets keep their own terms:

- **Material Symbols Outlined** — [Google Fonts / Material Symbols](https://fonts.google.com/icons), typically Apache License 2.0. Keep Google’s license/notice with redistributed font files if you publish this project.
- **Legacy outline icons** — `icons/search.svg`, `mic.svg`, `add.svg`, and `bell.svg` are Lucide-style SVGs (ISC License for [Lucide](https://lucide.dev/)). `icons/heart.svg` is a small local stand-in for the filled heart.
- **Downloaded YouTube icons** — `icons/<style>-<name>.svg` files are local copies of the experimental SVGs YouTube loads from `fonts.gstatic.com`. `script.sh` fetches them. They are YouTube/Google assets, separate from the Lucide stand-ins.

## Privacy

With the extension loaded, covered Material Symbols requests are answered from the extension package. On YouTube and YouTube Studio, mapped icon masks are rewritten to those local SVGs before the page requests them. Everything else behaves as usual.

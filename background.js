"use strict";

// Local Google Fonts replacements.

const cssURL = browser.runtime.getURL(
  "fonts/material-symbols.css"
);

const fontURL = browser.runtime.getURL(
  "fonts/MaterialSymbolsOutlined.ttf"
);

browser.webRequest.onBeforeRequest.addListener(
  details => {
    const url = new URL(details.url);

    // Replace the Google Fonts stylesheet.
    if (url.hostname === "fonts.googleapis.com") {
      const families = url.searchParams.getAll("family");

      if (families.some(f =>
        f.startsWith("Material Symbols Outlined")
      )) {
        return { redirectUrl: cssURL };
      }
    }

    // Replace the Material Symbols font.
    if (
      url.hostname === "fonts.gstatic.com" &&
      url.pathname.startsWith(
        "/s/materialsymbolsoutlined/"
      )
    ) {
      return { redirectUrl: fontURL };
    }

    return {};
  },
  {
    urls: [
      "https://fonts.googleapis.com/*",
      "https://fonts.gstatic.com/*"
    ]
  },
  ["blocking"]
);

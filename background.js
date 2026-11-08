const cssURL = browser.runtime.getURL(
  "fonts/material-symbols.css"
);

const fontURL = browser.runtime.getURL(
  "fonts/MaterialSymbolsOutlined.ttf"
);

browser.webRequest.onBeforeRequest.addListener(
  details => {
    const url = new URL(details.url);

    // Replace the Google Fonts CSS stylesheet
    if (url.hostname === "fonts.googleapis.com") {
      const families = url.searchParams.getAll("family");

      if (families.some(f =>
        f.startsWith("Material Symbols Outlined")
      )) {
        return { redirectUrl: cssURL };
      }
    }

    // Replace direct Google-hosted Material Symbols files
    if (url.hostname === "fonts.gstatic.com" &&
        url.pathname.startsWith(
          "/s/materialsymbolsoutlined/"
        )) {
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

const youtubeIcons = {
  search: "search.svg",
  mic: "mic.svg",
  add: "add.svg",
  bell: "bell.svg"
};

browser.webRequest.onBeforeRequest.addListener(
  details => {
    const url = new URL(details.url);

    const match = url.pathname.match(
      /^\/s\/i\/youtube_outline_experimental\/([^/]+)\/v\d+\/\d+px\.svg$/
    );

    if (!match) return {};

    const filename = youtubeIcons[match[1]];
    if (!filename) return {};

    const redirectUrl = browser.runtime.getURL(
      `icons/${filename}`
    );

    console.log("Local YouTube icon:", match[1]);

    return { redirectUrl };
  },
  {
    urls: [
      "https://fonts.gstatic.com/s/i/youtube_outline_experimental/*"
    ]
  },
  ["blocking"]
);

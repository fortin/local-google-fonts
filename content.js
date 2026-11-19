"use strict";

(() => {
  // ==========================================================
  // Local YouTube / YouTube Studio SVG restoration
  // ==========================================================

  const DEBUG = false;

  // Original locally bundled icons.
  const legacyIcons = {
    "outline-search": "search.svg",
    "outline-mic": "mic.svg",
    "outline-add": "add.svg",
    "outline-bell": "bell.svg",
    "fill-heart": "heart.svg"
  };

  // SVGs stored as icons/<style>-<name>.svg.
  // Only include files actually present in icons/.
  const bundledIcons = new Set([
    "fill-closed_captions",
    "fill-dashboard",
    "fill-pause",
    "fill-play",
    "fill-spark",

    "outline-alert_bubble",
    "outline-arrow_up_right",
    "outline-audio_square_stack",
    "outline-bell",
    "outline-chart_bar_square",
    "outline-closed_captions",
    "outline-dollar_sign_circle",
    "outline-gear",
    "outline-help_circle",
    "outline-live",
    "outline-magic_wand",
    "outline-person3",
    "outline-play_square_stack",
    "outline-search",
    "outline-square_pencil",
    "outline-text_bubble",
    "outline-subtitles",
    "outline-upload",
    "outline-video_camera_add",

    // Additional Studio icons.
    // Remove any entries whose SVGs you haven't downloaded.
    "outline-menu",
    "outline-x",
    "outline-filter",
    "outline-chevron_down",
    "outline-arrow_down",
    "outline-document",
    "outline-hd",
    "outline-sd",
    "outline-clock",
    "outline-link",
    "outline-dashboard",
    "fill-play_square_stack"
  ]);

  const iconPattern =
    /https:\/\/fonts\.gstatic\.com\/s\/i\/youtube_(outline|fill)_experimental\/([a-z0-9_]+)\/v\d+\/\d+px\.svg/g;

  const missingIcons = new Set();
  let replacedCount = 0;

  function localIconURL(style, name) {
    const key = `${style}-${name}`;

    // Preserve existing working replacements.
    const filename =
      legacyIcons[key] ||
      (bundledIcons.has(key) ? `${key}.svg` : null);

    if (!filename) {
      if (DEBUG && !missingIcons.has(key)) {
        missingIcons.add(key);
        console.log("[Local Icons] Unmapped:", key);
      }
      return null;
    }

    return browser.runtime.getURL(`icons/${filename}`);
  }

  function replaceURLs(value) {
    return value.replace(
      iconPattern,
      (original, style, name) =>
        localIconURL(style, name) || original
    );
  }

  function normalizedMask(value) {
    return value
      .replace(/\s+/g, " ")
      .replace(/\s+(?:alpha|luminance|match-source)\s*$/i, "")
      .trim();
  }

  function isLocalMask(value) {
    return value.includes("moz-extension://") &&
      value.includes("/icons/");
  }

  // Rewriting style notifies the observer. Chasing Firefox's
  // serialized mask value, or fighting YouTube's own style
  // update, hangs the page. A remote icon can be replaced
  // whenever it appears. A local mask gets one extra pass
  // to restore -webkit-mask, and then we stop.
  const localPasses = new WeakMap();
  const observedRoots = [];
  const observeOptions = {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["style"]
  };

  function reobserve() {
    for (const root of observedRoots) {
      observer.observe(root, observeOptions);
    }
  }

  function fixIcon(element) {
    if (!(element instanceof Element)) return;

    const inlineStyle = element.getAttribute("style");
    if (!inlineStyle) return;

    const hasRemote = inlineStyle.includes(
      "fonts.gstatic.com/s/i/youtube_"
    );
    const hasLocal = isLocalMask(inlineStyle);

    if (!hasRemote && !hasLocal) return;

    // Outline ↔ fill swaps reuse the same node. Clear the
    // local-only pass limit when a remote URL returns.
    if (hasRemote) localPasses.delete(element);

    const mask = element.style.getPropertyValue("mask");
    const webkit = element.style.getPropertyValue("-webkit-mask");
    const maskHasMode = /(?:^|\s)(?:alpha|luminance|match-source)\s*$/i
      .test(mask.trim());

    if (
      !hasRemote &&
      isLocalMask(mask) &&
      isLocalMask(webkit) &&
      !maskHasMode
    ) {
      return;
    }

    if (!hasRemote && (localPasses.get(element) || 0) >= 1) {
      return;
    }

    const remoteValue = [mask, webkit].find(value =>
      value.includes("fonts.gstatic.com/s/i/youtube_")
    );
    const localValue = normalizedMask(
      remoteValue ? replaceURLs(remoteValue) : (mask || webkit)
    );

    if (remoteValue && !isLocalMask(localValue)) return;
    if (!isLocalMask(localValue)) return;

    if (!hasRemote) localPasses.set(element, 1);

    const customProps = [];

    for (const property of element.style) {
      if (!property.startsWith("--")) continue;

      const original = element.style.getPropertyValue(property);
      if (!original.includes("fonts.gstatic.com/s/i/youtube_")) {
        continue;
      }

      const replacement = replaceURLs(original);
      if (replacement !== original) {
        customProps.push([property, replacement]);
      }
    }

    observer.disconnect();

    try {
      for (const [property, replacement] of customProps) {
        element.style.setProperty(property, replacement);
      }

      // `mask: url(...) alpha` is the clicked captions style.
      // That keyword blanks the SVG. The visible style is the
      // same url without a mask mode, on both properties.
      element.style.removeProperty("mask-mode");
      element.style.removeProperty("-webkit-mask-mode");
      element.style.setProperty("mask", localValue);
      element.style.setProperty("-webkit-mask", localValue);
      replacedCount++;
    } finally {
      reobserve();
    }

    if (DEBUG) {
      console.log("[Local Icons] Replaced:", localValue);
    }
  }

  function attachObserver(root) {
    if (!root || observedRoots.includes(root)) return;

    observedRoots.push(root);
    observer.observe(root, observeOptions);
  }

  // Scan an element and its descendants, including open shadow roots.
  function scan(root) {
    if (!root) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
      fixIcon(root);

      if (root.shadowRoot) {
        scan(root.shadowRoot);
        attachObserver(root.shadowRoot);
      }
    }

    if (!root.querySelectorAll) return;

    root.querySelectorAll(
      '[style*="fonts.gstatic.com/s/i/youtube_"], [style*="moz-extension://"][style*="/icons/"]'
    ).forEach(fixIcon);

    root.querySelectorAll("*").forEach(element => {
      if (!element.shadowRoot) return;
      scan(element.shadowRoot);
      attachObserver(element.shadowRoot);
    });
  }

  // Watch for YouTube's dynamically rendered icons.
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        fixIcon(mutation.target);
      } else if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          scan(node);
        }
      }
    }
  });

  // Repair icons already in the DOM.
  scan(document);
  attachObserver(document.documentElement);

  console.info(
    "[Local Icons] Active on",
    location.hostname
  );
})();

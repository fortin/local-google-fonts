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

  const maskProperties = [
    "mask",
    "-webkit-mask",
    "mask-image",
    "-webkit-mask-image"
  ];

  function fixIcon(element) {
    if (!(element instanceof Element)) return;

    const inlineStyle = element.getAttribute("style");

    if (
      !inlineStyle ||
      !inlineStyle.includes("fonts.gstatic.com/s/i/youtube_")
    ) {
      return;
    }

    let changed = false;

    // Work on the actual CSS declarations so we preserve
    // YouTube's mask positioning, repeat and sizing.
    for (const property of maskProperties) {
      const original =
        element.style.getPropertyValue(property);

      if (!original.includes("fonts.gstatic.com")) {
        continue;
      }

      const replacement = replaceURLs(original);

      if (replacement === original) continue;

      const priority =
        element.style.getPropertyPriority(property);

      element.style.setProperty(
        property,
        replacement,
        priority
      );

      changed = true;
      replacedCount++;

      if (DEBUG) {
        console.log(
          "[Local Icons] Replaced:",
          original,
          "→",
          replacement
        );
      }
    }

    for (const property of element.style) {
      if (!property.startsWith("--")) continue;

      const original =
        element.style.getPropertyValue(property);

      if (!original.includes("fonts.gstatic.com/s/i/youtube_")) {
        continue;
      }

      const replacement = replaceURLs(original);
      if (replacement === original) continue;

      element.style.setProperty(
        property,
        replacement,
        element.style.getPropertyPriority(property)
      );

      changed = true;
    }

    if (!changed) return;

    // The mask shorthand resets mask-mode to match-source.
    // YouTube paints these with background-color, so the SVG
    // has to be an alpha mask. Luminance mode treats the
    // black fill as empty and the button stays blank.
    element.style.setProperty("mask-mode", "alpha");
    element.style.setProperty("-webkit-mask-mode", "alpha");
  }

  const observedRoots = new WeakSet();

  function attachObserver(root) {
    if (!root || observedRoots.has(root)) return;

    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style"]
    });

    observedRoots.add(root);
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
      '[style*="fonts.gstatic.com/s/i/youtube_"]'
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

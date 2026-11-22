export default {
  ignoreFiles: [
    "package.json",
    "package-lock.json",
    "node_modules/**",
    "web-ext-config.mjs",
    "script.sh",
    "README.md",
    "LICENSE",
    ".git/**",
    ".gitignore",
    ".DS_Store",
    "web-ext-artifacts/**",
    "**/.DS_Store"
  ],
  build: {
    overwriteDest: true
  }
};

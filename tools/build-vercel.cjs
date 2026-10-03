const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "public");

fs.mkdirSync(path.join(outputDir, "data"), { recursive: true });
fs.copyFileSync(
  path.join(projectRoot, "index.html"),
  path.join(outputDir, "index.html"),
);
fs.cpSync(path.join(projectRoot, "src"), path.join(outputDir, "src"), {
  recursive: true,
});
fs.cpSync(path.join(projectRoot, "assets"), path.join(outputDir, "assets"), {
  recursive: true,
});
fs.copyFileSync(
  path.join(projectRoot, "data", "umbrellas.json"),
  path.join(outputDir, "data", "umbrellas.json"),
);

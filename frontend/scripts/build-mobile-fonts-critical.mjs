/**
 * Builds a tiny critical mobile font sheet (Manrope cyrillic + latin only)
 * and a slimmed full mobile sheet (drop greek / vietnamese / greek-ext —
 * unused for a BG-first site, and they inflate the critical font chain).
 *
 * Source of truth: fonts.full.css (restored from Google via fetch-mobile-fonts.mjs).
 * Outputs: fonts-critical.css + fonts.css (slim).
 */
import fs from "fs";
import path from "path";

const DIR = path.join("public", "fonts", "mobile");
const FULL = path.join(DIR, "fonts.full.css");
const FALLBACK = path.join(DIR, "fonts.css");

const srcPath = fs.existsSync(FULL) ? FULL : FALLBACK;
const css = fs.readFileSync(srcPath, "utf8");

/** Split into individual @font-face blocks (comment before each is discarded). */
const faces = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/g)].map((m) => m[0]);

function family(face) {
  const m = face.match(/font-family:\s*'([^']+)'/);
  return m?.[1] ?? "";
}

function unicodeRange(face) {
  const m = face.match(/unicode-range:\s*([^;]+);/);
  return (m?.[1] ?? "").trim();
}

function isGreek(face) {
  const u = unicodeRange(face);
  return u.includes("U+0370") || u.includes("U+1F00");
}

function isVietnamese(face) {
  const u = unicodeRange(face);
  return u.includes("U+0102-0103");
}

function isCyrillicMain(face) {
  const u = unicodeRange(face);
  return u.includes("U+0400-045F");
}

function isLatinMain(face) {
  const u = unicodeRange(face);
  return u.includes("U+0000-00FF");
}

/** Critical path: Manrope cyrillic only — hero title is BG text (one woff2 file). */
const critical = faces.filter((f) => {
  if (family(f) !== "Manrope") return false;
  return isCyrillicMain(f);
});

/** Full mobile sheet without unused scripts (greek / vietnamese). */
const slim = faces.filter((f) => !isGreek(f) && !isVietnamese(f));

function minify(facesList) {
  return facesList
    .map((f) =>
      f
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ")
        .replace(/\s*{\s*/g, "{")
        .replace(/\s*}\s*/g, "}")
        .replace(/;\s*/g, ";")
        .replace(/font-display:swap;\s*font-display:swap;/g, "font-display:swap;")
        .trim(),
    )
    .join("");
}

const criticalCss = minify(critical);
const slimCss = minify(slim);

fs.writeFileSync(path.join(DIR, "fonts-critical.css"), criticalCss);
fs.writeFileSync(path.join(DIR, "fonts.css"), slimCss);

console.log("source", path.basename(srcPath));
console.log("critical", criticalCss.length, "bytes,", critical.length, "faces");
console.log("slim full", slimCss.length, "bytes,", slim.length, "faces");
console.log("dropped greek/viet faces:", faces.length - slim.length, "of", faces.length);

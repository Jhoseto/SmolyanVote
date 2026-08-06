import fs from "fs";
import path from "path";

const OUT = path.join("public", "fonts");
const cssUrl = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css";

/** Icons used in shell + home above-the-fold (navbar, footer, home sections). */
const ICONS = new Set([
  "house-door",
  "hand-index-thumb",
  "shield-check",
  "chat-square-text",
  "chat-fill",
  "geo-alt-fill",
  "broadcast",
  "info-circle",
  "chevron-down",
  "chevron-up",
  "hand-thumbs-up",
  "hand-thumbs-up-fill",
  "hand-thumbs-down",
  "hand-thumbs-down-fill",
  "share",
  "bookmark",
  "bookmark-fill",
  "eye-fill",
  "flag",
  "check-circle-fill",
  "facebook",
  "instagram",
  "youtube",
  "twitter-x",
  "globe2",
  "phone",
  "grid",
  "building",
  "people",
  "calendar-event",
  "basket",
  "exclamation-diamond",
  "diagram-3",
  "map",
  "journal-text",
  "graph-up",
  "arrow-right",
  "envelope",
  "person-plus",
  "person-check-fill",
  "shield-exclamation",
  "shield-lock",
  "lightning",
  "geo-alt",
  "play-fill",
  "person",
  "person-circle",
  "box-arrow-right",
  "pencil-square",
  "pencil",
  "three-dots",
  "three-dots-vertical",
  "shield-x",
  "file-earmark-plus",
  "list-check",
  "check2-square",
  "ui-checks",
  "bar-chart-steps",
  "plus-circle",
  "eye",
  "grid-3x3-gap",
  "bell",
  "arrow-up",
  "calendar2-check",
  "x-lg",
  "download",
  "shield-lock",
]);

fs.mkdirSync(OUT, { recursive: true });

const css = await (await fetch(cssUrl)).text();
const woffUrl =
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2";
const woff = Buffer.from(await (await fetch(woffUrl)).arrayBuffer());
fs.writeFileSync(path.join(OUT, "bootstrap-icons.woff2"), woff);
console.log("woff2", woff.length);

const fullCss = css
  .replace(/font-display:\s*block/g, "font-display:swap")
  .replace(/url\(["']?\.\/fonts\/bootstrap-icons\.woff2[^"')]*["']?\)/g, 'url(/fonts/bootstrap-icons.woff2)')
  .replace(/url\(["']?\.\/fonts\/bootstrap-icons\.woff[^"')]*["']?\)/g, "");
fs.writeFileSync(path.join(OUT, "bootstrap-icons.css"), fullCss);
console.log("full css bytes", Buffer.byteLength(fullCss));

const baseRules = `@font-face{font-display:swap;font-family:bootstrap-icons;src:url(/fonts/bootstrap-icons.woff2) format("woff2");}
.bi::before,[class^="bi-"]::before,[class*=" bi-"]::before{display:inline-block;font-family:bootstrap-icons!important;font-style:normal;font-weight:400!important;font-variant:normal;text-transform:none;line-height:1;vertical-align:-.125em;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}`;

const iconRules = css
  .split("\n")
  .filter((line) => {
    const m = line.match(/^\.bi-([a-z0-9-]+)::before/);
    return m && ICONS.has(m[1]);
  })
  .map((line) => line.trim());

const subset = `${baseRules}\n${iconRules.join("\n")}\n`;
fs.writeFileSync(path.join(OUT, "bootstrap-icons-shell.css"), subset);
console.log("subset rules", iconRules.length, "css bytes", Buffer.byteLength(subset));

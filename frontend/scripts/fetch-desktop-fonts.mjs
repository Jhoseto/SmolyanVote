import fs from "fs";
import path from "path";

const DESKTOP_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap&subset=cyrillic,latin";
const OUT_DIR = path.join("public", "fonts", "desktop");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

fs.mkdirSync(OUT_DIR, { recursive: true });

const cssRes = await fetch(DESKTOP_FONTS_URL, {
  headers: { "User-Agent": UA },
});
if (!cssRes.ok) throw new Error(`fonts css ${cssRes.status}`);
const css = await cssRes.text();

const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
const seen = new Set();

for (const url of urls) {
  const name = url.split("/").pop().split("?")[0];
  if (seen.has(name)) continue;
  seen.add(name);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`woff2 ${name} ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log("woff2", name, buf.length);
}

let localCss = css.replace(/url\((https:[^)]+)\)/g, (_m, url) => {
  const name = url.split("/").pop().split("?")[0];
  return `url(/fonts/desktop/${name})`;
});
localCss = localCss.replace(/@font-face\s*\{/g, "@font-face{font-display:swap;");
fs.writeFileSync(path.join(OUT_DIR, "fonts.css"), localCss);
console.log("css bytes", localCss.length, "files", seen.size);

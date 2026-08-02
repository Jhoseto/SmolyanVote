#!/usr/bin/env node
/**
 * Standalone SIGMA spot-check — compares live sigma.midt.bg CSV against nothing local,
 * but validates that value_eur parses and reports sample rows for manual audit.
 *
 * Usage: node scripts/sigma-spotcheck.mjs [authorityEik] [sampleSize]
 * Default: 000615118 (Smolyan) sample 10
 */

const BGN_PER_EUR = 1.95583;
const SMOLYAN_EIK = process.argv[2] || "000615118";
const SAMPLE = Math.min(Number(process.argv[3] || 10), 30);
const CSV_URL = `https://sigma.midt.bg/contracts.csv?authority=${SMOLYAN_EIK}`;

function parseCsvRows(csv) {
  const rows = [];
  const fields = [];
  let current = "";
  let inQuotes = false;
  const text = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = false;
      } else current += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      fields.push(current);
      current = "";
    } else if (c === "\n") {
      fields.push(current);
      current = "";
      if (fields.length) rows.push([...fields]);
      fields.length = 0;
    } else if (c !== "\r") current += c;
  }
  if (current || fields.length) {
    fields.push(current);
    rows.push(fields);
  }
  return rows;
}

function indexHeader(header) {
  const map = {};
  header.forEach((h, i) => {
    map[h.trim().toLowerCase().replace(/^\uFEFF/, "")] = i;
  });
  return map;
}

function cell(row, idx, key) {
  const i = idx[key];
  if (i == null || i >= row.length) return null;
  const v = row[i];
  return v == null ? null : v.trim();
}

async function fetchCsv(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (process.platform === "win32") {
      const { execSync } = await import("node:child_process");
      return execSync(`curl.exe -sS "${url}"`, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
    }
    throw err;
  }
}

async function main() {
  console.log(`Fetching ${CSV_URL} …`);
  const csv = await fetchCsv(CSV_URL);
  const rows = parseCsvRows(csv);
  if (rows.length <= 1) {
    console.error("Empty CSV");
    process.exit(1);
  }
  const idx = indexHeader(rows[0]);
  const dataRows = rows.slice(1, 1 + SAMPLE);
  let ok = 0;
  let bad = 0;
  console.log(`\nSIGMA spot-check (${SMOLYAN_EIK}) — first ${dataRows.length} rows:\n`);
  for (const row of dataRows) {
    const id = cell(row, idx, "id");
    const unp = cell(row, idx, "unp");
    const valueEur = cell(row, idx, "value_eur");
    const signed = cell(row, idx, "signed_at");
    const parsed = valueEur ? Number(valueEur.replace(",", ".")) : NaN;
    const valid = id && valueEur && !Number.isNaN(parsed) && parsed > 0;
    if (valid) ok++;
    else bad++;
    console.log(
      `${valid ? "✓" : "✗"} ${id ?? "?"} | UNP ${unp ?? "—"} | ${valueEur ?? "—"} EUR | signed ${signed ?? "—"}`,
    );
  }
  console.log(`\n${ok} valid / ${bad} problematic of ${dataRows.length}`);
  console.log(`BNB rate reference: 1 EUR = ${BGN_PER_EUR} BGN`);
  process.exit(bad > 0 ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

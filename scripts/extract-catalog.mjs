import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error("Usage: extract-catalog.mjs <xlsx> <output.json>");

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const modelsSheet = workbook.worksheets.getItem("Product Module");
const skuSheet = workbook.worksheets.getItem("上市SKU");

const models = {};
for (const [rawCode, name] of modelsSheet.getRange("A2:B11").values) {
  const code = String(rawCode ?? "").trim();
  if (code) models[code] = String(name ?? "").trim();
}

const rules = new Map();
const blocks = [
  { range: "A2:F83", product: 3, flavorName: 2, flavor: 5 },
  { range: "H2:N83", product: 4, flavorName: 3, flavor: 6 },
  { range: "P2:U83", product: 3, flavorName: 2, flavor: 5 },
  { range: "W2:AB83", product: 3, flavorName: 2, flavor: 5 },
];

for (const block of blocks) {
  for (const row of skuSheet.getRange(block.range).values) {
    const productCode = String(row[block.product] ?? "").trim();
    const flavorCode = String(row[block.flavor] ?? "");
    const flavorName = String(row[block.flavorName] ?? "").trim();
    if (!productCode || flavorCode.length !== 3) continue;
    const key = `${productCode}\u0000${flavorCode}`;
    if (!rules.has(key)) rules.set(key, { productCode, flavorCode, flavorName });
  }
}

const catalog = {
  generatedFrom: source.split(/[\\/]/).pop(),
  generatedAt: new Date().toISOString(),
  models,
  rules: [...rules.values()].sort((a, b) =>
    a.productCode.localeCompare(b.productCode) || a.flavorName.localeCompare(b.flavorName),
  ),
};

await fs.mkdir(path.dirname(path.resolve(destination)), { recursive: true });
await fs.writeFile(destination, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Extracted ${catalog.rules.length} valid product/flavor combinations.`);

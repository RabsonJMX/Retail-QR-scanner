import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (file) => fs.readFile(path.join(root, file), "utf8");

const [html, styles, vendor, dbSource, rulesSource, appSource, catalogText] = await Promise.all([
  read("index.html"),
  read("styles.css"),
  read("vendor/html5-qrcode.min.js"),
  read("db.js"),
  read("qr-rules.js"),
  read("app.js"),
  read("data/catalog.json"),
]);

const db = dbSource.replaceAll("export ", "");
const rules = rulesSource.replaceAll("export ", "");
const app = appSource
  .replace(/^import .*?;\r?\n/gm, "")
  .replace(
    '[db, catalog] = await Promise.all([openDatabase(), fetch("./data/catalog.json").then((response) => response.json())]);',
    "db = await openDatabase(); catalog = EMBEDDED_CATALOG;",
  );
const script = `const EMBEDDED_CATALOG = ${catalogText.trim()};\n${db}\n${rules}\n${app}`;

const output = html
  .replace('    <link rel="stylesheet" href="./styles.css" />', `    <style>\n${styles}\n    </style>`)
  .replace('    <script src="./vendor/html5-qrcode.min.js"></script>', `    <script>\n${vendor}\n    </script>`)
  .replace('    <script type="module" src="./app.js"></script>', `    <script>\n${script}\n    </script>`)
  .replace("<title>PIXL 门店扫码</title>", "<title>PIXL 门店扫码 - 单文件版</title>");

const destination = path.join(root, "门店扫码.html");
new Function(script);
if (/<script[^>]+src=|<link[^>]+stylesheet|fetch\("\.\/data\//.test(output)) {
  throw new Error("Standalone output still contains an external dependency");
}
await fs.writeFile(destination, output, "utf8");
console.log(`Created and validated ${destination}`);

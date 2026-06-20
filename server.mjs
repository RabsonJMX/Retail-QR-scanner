import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8" };
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relative = normalize(pathname === "/" ? "index.html" : pathname.slice(1));
  const file = join(root, relative);
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { response.writeHead(404); response.end("Not found"); return; }
  response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control":"no-store" });
  createReadStream(file).pipe(response);
});
server.listen(4173, "127.0.0.1", () => console.log("PIXL Scan: http://localhost:4173"));

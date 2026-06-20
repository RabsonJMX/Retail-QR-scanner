import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const requiredInputs = [...html.matchAll(/<input\b[^>]*\brequired\b[^>]*>/g)].map(([input]) => input.match(/id="([^"]+)"/)?.[1]);
assert.deepEqual(requiredInputs, ["store-name-input"]);
assert.match(html, /id="store-postcode-input"(?![^>]*\brequired\b)/);
assert.match(html, /id="store-decision-maker-input"(?![^>]*\brequired\b)/);
assert.match(html, /id="store-contact-input"(?![^>]*\brequired\b)/);
console.log("Store form requirement tests passed");

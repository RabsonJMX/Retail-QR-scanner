import assert from "node:assert/strict";
import { parseQr } from "../qr-rules.js";

const catalog = { models: { P8T03: "Tank" }, rules: [{ productCode: "P8T03", flavorCode: "$O^", flavorName: "Test" }] };
const now = new Date("2026-06-20T12:00:00");
const valid = "P8T03E8%2*d$O^20250826103858";
assert.equal(valid.length, 28);
assert.equal(parseQr(valid, catalog, now).valid, true);
assert.equal(parseQr(valid.slice(0, -1), catalog, now).valid, false);
assert.equal(parseQr(valid.replace("$O^", "BAD"), catalog, now).valid, false);
assert.equal(parseQr(valid.replace("20250826", "20251340"), catalog, now).valid, false);

const photographedCatalog = { models: { P8T03: "PIXL 8K Tank Kit" }, rules: [{ productCode: "P8T03", flavorCode: "\\U#", flavorName: "Pineapple Ice" }] };
const photographedCode = "P8T03Bm$G`@\\U#20260408152749";
assert.equal(photographedCode.length, 28);
assert.equal(parseQr(photographedCode, photographedCatalog, new Date("2026-06-22T12:00:00")).valid, true);
console.log("QR rule tests passed");

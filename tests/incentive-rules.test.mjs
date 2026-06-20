import assert from "node:assert/strict";
import { calculateBatch, isValidUkPostcode, normalizePostcode } from "../incentive-rules.js";

assert.equal(normalizePostcode("sw1a1aa"), "SW1A 1AA");
assert.equal(isValidUkPostcode("SW1A 1AA"), true);
assert.equal(isValidUkPostcode("M1 1AE"), true);
assert.equal(isValidUkPostcode("12345"), false);
assert.deepEqual(calculateBatch([
  { productCode: "P8W03" },
  { productCode: "P8T03" },
  { productCode: "P8T03" },
  { productCode: "P5W05" },
]), { points: 4, kitCount: 1, podCount: 2, salesPence: 5300, rebatePence: 1060 });
console.log("Incentive rule tests passed");

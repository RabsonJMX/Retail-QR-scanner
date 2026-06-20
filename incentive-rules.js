export const UK_POSTCODE_PATTERN = /^(GIR 0AA|(?:(?:[A-PR-UWYZ][0-9][0-9A-HJKSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9][0-9ABEHMNPRVWXY]?)[ ]?[0-9][ABD-HJLNP-UW-Z]{2}))$/i;

export function normalizePostcode(value) {
  const compact = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  return compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
}

export function isValidUkPostcode(value) {
  return UK_POSTCODE_PATTERN.test(normalizePostcode(value));
}

export function calculateBatch(scans) {
  const kitCount = scans.filter((scan) => scan.productCode === "P8W03").length;
  const podCount = scans.filter((scan) => scan.productCode === "P8T03").length;
  const salesPence = kitCount * 2200 + podCount * 1550;
  return {
    points: scans.length,
    kitCount,
    podCount,
    salesPence,
    rebatePence: Math.round(salesPence * 0.2),
  };
}

export const QR_LENGTH = 28;

export function createRuleIndex(catalog) {
  return new Map(catalog.rules.map((rule) => [`${rule.productCode}\u0000${rule.flavorCode}`, rule]));
}

export function parseQr(rawValue, catalog, now = new Date()) {
  const value = String(rawValue ?? "").replace(/[\r\n]+$/g, "");
  if (value.length !== QR_LENGTH) return { valid: false, reason: `二维码应为 ${QR_LENGTH} 位，当前为 ${value.length} 位` };

  const productCode = value.slice(0, 5);
  const uniqueCode = value.slice(5, 11);
  const flavorCode = value.slice(11, 14);
  const timeCode = value.slice(14, 28);
  if (!/^[\x20-\x7E]{6}$/.test(uniqueCode)) return { valid: false, reason: "6 位唯一码含有非 ASCII 字符" };
  if (!/^\d{14}$/.test(timeCode)) return { valid: false, reason: "时间码必须为 14 位数字" };

  const match = createRuleIndex(catalog).get(`${productCode}\u0000${flavorCode}`);
  if (!match) return { valid: false, reason: "产品码与口味码不在编码表中" };

  const year = Number(timeCode.slice(0, 4));
  const month = Number(timeCode.slice(4, 6));
  const day = Number(timeCode.slice(6, 8));
  const hour = Number(timeCode.slice(8, 10));
  const minute = Number(timeCode.slice(10, 12));
  const second = Number(timeCode.slice(12, 14));
  const timestamp = new Date(year, month - 1, day, hour, minute, second);
  const exact = timestamp.getFullYear() === year && timestamp.getMonth() === month - 1 && timestamp.getDate() === day && timestamp.getHours() === hour && timestamp.getMinutes() === minute && timestamp.getSeconds() === second;
  if (!exact || year < 2020 || timestamp.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    return { valid: false, reason: "生产时间码不是有效日期" };
  }

  return {
    valid: true,
    value,
    productCode,
    uniqueCode,
    flavorCode,
    timeCode,
    producedAt: timestamp.toISOString(),
    productName: catalog.models[productCode] ?? productCode,
    flavorName: match.flavorName || flavorCode,
  };
}

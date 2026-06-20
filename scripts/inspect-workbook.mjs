import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = process.argv[2];
if (!source) throw new Error("Workbook path is required");

const input = await FileBlob.load(source);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 8000,
});
console.log("SHEETS");
console.log(sheets.ndjson);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange(true);
  if (!used) continue;
  const region = await workbook.inspect({
    kind: "region",
    sheetId: sheet.name,
    range: used.address,
    include: "values,formulas",
    tableMaxRows: 200,
    tableMaxCols: 30,
    maxChars: 30000,
  });
  console.log(`SHEET ${sheet.name} ${used.address}`);
  console.log(region.ndjson);
}

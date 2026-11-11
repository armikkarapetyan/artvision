
const fs = require("node:fs");
const path = require("node:path");

const filePath = path.resolve(
  __dirname,
  "../dataset/processed/features.csv"
);

const content = fs.readFileSync(filePath, "utf8").trim();
const lines = content.split(/\r?\n/);

const headers = lines[0].split(",");
const rows = lines.slice(1);

const expectedStyles = [
  "Expressionism",
  "Impressionism",
  "Realism",
  "Romanticism",
];

const counts = {};

let invalidRows = 0;

for (const row of rows) {
  const values = row.split(",");

  const label = values[1]?.replace(/^"|"$/g, "");

  counts[label] = (counts[label] || 0) + 1;

  const numericValues = values.slice(2);

  if (
    values.length !== headers.length ||
    numericValues.some((value) => !Number.isFinite(Number(value)))
  ) {
    invalidRows++;
  }
}

console.log("DATASET VALIDATION");
console.log("------------------");

console.log(`Total images: ${rows.length}`);
console.log(`Total columns: ${headers.length}`);

for (const style of expectedStyles) {
  console.log(`${style}: ${counts[style] || 0}`);
}

console.log(`Invalid rows: ${invalidRows}`);

const correctCounts = expectedStyles.every(
  (style) => counts[style] === 300
);

if (
  rows.length === 1200 &&
  correctCounts &&
  invalidRows === 0
) {
  console.log("\nDataset validation PASSED!");
} else {
  console.log("\nDataset validation FAILED!");
}

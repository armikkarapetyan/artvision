
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");

const inputDir = path.join(root, "dataset/processed/images");
const outputDir = path.join(root, "dataset/processed");

const outputFile = path.join(outputDir, "features.csv");

const BINS = 16;

function extractFeatures(buffer, channels) {
  const pixelCount = buffer.length / channels;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumBrightness = 0;
  let sumBrightnessSquared = 0;

  const histogram = {
    r: Array(BINS).fill(0),
    g: Array(BINS).fill(0),
    b: Array(BINS).fill(0),
  };

  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];

    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

    sumR += r;
    sumG += g;
    sumB += b;

    sumBrightness += brightness;
    sumBrightnessSquared += brightness * brightness;

    histogram.r[Math.min(BINS - 1, Math.floor(r / 256 * BINS))]++;
    histogram.g[Math.min(BINS - 1, Math.floor(g / 256 * BINS))]++;
    histogram.b[Math.min(BINS - 1, Math.floor(b / 256 * BINS))]++;
  }

  const meanBrightness = sumBrightness / pixelCount;

  const variance =
    sumBrightnessSquared / pixelCount -
    meanBrightness * meanBrightness;

  const contrast = Math.sqrt(Math.max(0, variance));

  const features = [
    sumR / pixelCount,
    sumG / pixelCount,
    sumB / pixelCount,
    meanBrightness,
    contrast,
  ];

  for (const channel of ["r", "g", "b"]) {
    for (const count of histogram[channel]) {
      features.push(count / pixelCount);
    }
  }

  return features;
}

async function main() {
  const styles = fs.readdirSync(inputDir, {
    withFileTypes: true,
  }).filter((item) => item.isDirectory());

  const headers = [
    "image",
    "label",
    "meanR",
    "meanG",
    "meanB",
    "brightness",
    "contrast",
  ];

  for (const channel of ["r", "g", "b"]) {
    for (let i = 0; i < BINS; i++) {
      headers.push(`${channel}_hist_${i}`);
    }
  }

  const rows = [headers.join(",")];

  let total = 0;

  for (const style of styles) {
    const styleDir = path.join(inputDir, style.name);

    const files = fs.readdirSync(styleDir).filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

    for (const file of files) {
      const imagePath = path.join(styleDir, file);

      const { data, info } = await sharp(imagePath)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const features = extractFeatures(data, info.channels);

      const row = [
        `"${file.replace(/"/g, '""')}"`,
        `"${style.name}"`,
        ...features.map((value) => value.toFixed(6)),
      ];

      rows.push(row.join(","));
      total++;
    }

    console.log(`${style.name}: ${files.length} images analyzed`);
  }

  fs.writeFileSync(outputFile, rows.join("\n"), "utf8");

  console.log("\nFeature extraction completed!");
  console.log(`Total images: ${total}`);
  console.log(`Total features per image: ${headers.length - 2}`);
  console.log(`CSV file: ${outputFile}`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exitCode = 1;
});


const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const projectRoot = path.resolve(__dirname, "..");

const inputDir = path.join(
  projectRoot,
  "dataset/processed/selected_train"
);

const outputDir = path.join(
  projectRoot,
  "dataset/processed/images"
);

const imageSize = 128;

async function preprocessImages() {
  if (fs.existsSync(outputDir)) {
    throw new Error("Output folder already exists.");
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const styles = fs.readdirSync(inputDir, {
    withFileTypes: true,
  }).filter((item) => item.isDirectory());

  let processedCount = 0;

  for (const style of styles) {
    const styleInputDir = path.join(inputDir, style.name);
    const styleOutputDir = path.join(outputDir, style.name);

    fs.mkdirSync(styleOutputDir, { recursive: true });

    const files = fs.readdirSync(styleInputDir).filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

    for (const file of files) {
      const inputPath = path.join(styleInputDir, file);
      const outputName = `${path.parse(file).name}.jpg`;
      const outputPath = path.join(styleOutputDir, outputName);

      await sharp(inputPath)
        .rotate()
        .resize(imageSize, imageSize, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255 },
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      processedCount++;
    }

    console.log(`${style.name}: ${files.length} images processed`);
  }

  console.log("\nPreprocessing completed!");
  console.log(`Total processed images: ${processedCount}`);
  console.log(`Image size: ${imageSize}x${imageSize}`);
}

preprocessImages().catch((error) => {
  console.error("Preprocessing error:", error.message);
  process.exitCode = 1;
});

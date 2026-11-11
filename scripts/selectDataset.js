
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(projectRoot, "dataset/raw/train");
const outputDir = path.join(
  projectRoot,
  "dataset/processed/selected_train"
);

const styles = [
  "Impressionism",
  "Realism",
  "Expressionism",
  "Romanticism",
];

const imagesPerStyle = 300;
const seed = 2026;

// Reproducible random generator
function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle array
function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function escapeCsv(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function selectImages() {
  if (fs.existsSync(outputDir)) {
    throw new Error(
      "Output folder already exists. Check selected_train first."
    );
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const random = mulberry32(seed);
  const manifest = ["image,label,source_path"];

  for (const style of styles) {
    const styleSource = path.join(sourceDir, style);

    if (!fs.existsSync(styleSource)) {
      throw new Error(`Style folder not found: ${style}`);
    }

    const files = fs
      .readdirSync(styleSource, { withFileTypes: true })
      .filter(
        (file) =>
          file.isFile() &&
          /\.(jpg|jpeg|png|webp)$/i.test(file.name)
      )
      .map((file) => file.name)
      .sort();

    if (files.length < imagesPerStyle) {
      throw new Error(`Not enough images in ${style}`);
    }

    const selected = shuffle([...files], random).slice(
      0,
      imagesPerStyle
    );

    const destination = path.join(outputDir, style);
    fs.mkdirSync(destination, { recursive: true });

    for (const filename of selected) {
      const sourcePath = path.join(styleSource, filename);
      const destinationPath = path.join(destination, filename);

      fs.copyFileSync(sourcePath, destinationPath);

      const relativePath = path
        .relative(projectRoot, sourcePath)
        .split(path.sep)
        .join("/");

      manifest.push(
        [
          escapeCsv(filename),
          escapeCsv(style),
          escapeCsv(relativePath),
        ].join(",")
      );
    }

    console.log(`${style}: ${selected.length} images selected`);
  }

  const manifestPath = path.join(outputDir, "manifest.csv");

  fs.writeFileSync(
    manifestPath,
    manifest.join("\n"),
    "utf8"
  );

  console.log("\nDataset selection completed!");
  console.log(`Total images: ${styles.length * imagesPerStyle}`);
  console.log(`Manifest: ${manifestPath}`);
}

try {
  selectImages();
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
}

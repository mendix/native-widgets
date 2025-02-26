/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const core = require('@actions/core');

const platform = process.argv[2];
const actualDir = path.join(__dirname, `../../images/actual/${platform}`);
const expectedDir = path.join(__dirname, `../../maestro/images/expected/${platform}`);
const diffDir = path.join(__dirname, `../../images/diffs/${platform}-${process.env.GITHUB_RUN_ID}`);

if (!fs.existsSync(diffDir)) {
  fs.mkdirSync(diffDir, { recursive: true });
}

const failedComparisons = [];

fs.readdirSync(actualDir).forEach(widget => {
  const widgetActualDir = path.join(actualDir, widget);
  const widgetExpectedDir = path.join(expectedDir, widget);
  const widgetDiffDir = path.join(diffDir, widget);

  if (!fs.existsSync(widgetDiffDir)) {
    fs.mkdirSync(widgetDiffDir, { recursive: true });
  }

  fs.readdirSync(widgetActualDir).forEach(file => {
    const actualPath = path.join(widgetActualDir, file);
    const expectedPath = path.join(widgetExpectedDir, file);
    const diffPath = path.join(widgetDiffDir, `diff_${file}`);

    if (fs.existsSync(expectedPath)) {
      const actualImg = PNG.sync.read(fs.readFileSync(actualPath));
      const expectedImg = PNG.sync.read(fs.readFileSync(expectedPath));
      const { width, height } = actualImg;
      const diff = new PNG({ width, height });

      const numDiffPixels = pixelmatch(actualImg.data, expectedImg.data, diff.data, width, height, { threshold: 0.1 });

      const pixelTolerance = 50;
      
      if (numDiffPixels > pixelTolerance) {
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
        failedComparisons.push(file);
        console.log(`❌ Comparison failed for ${file}`);
      } else {
        fs.appendFileSync(path.join(__dirname, '../../compare_output.txt'), `✅ Comparison passed for ${file}\n`);
        console.log(`✅ Comparison passed for ${file}`);
      }
    } else {
      console.log(`⚠️ Expected file not found for ${file}`);
    }
  });
});

if (failedComparisons.length > 0) {
  fs.appendFileSync(path.join(__dirname, '../../compare_output.txt'), `❌ Failed Comparisons:\n`);
  failedComparisons.forEach(file => {
    fs.appendFileSync(path.join(__dirname, '../../compare_output.txt'), `  - ${file}\n`);
  });
  console.log(`❌ Failed Comparisons: ${failedComparisons.join(', ')}`);
  core.exportVariable(`${platform.toUpperCase()}_COMPARISON_FAILED`, 'true');
} else {
  fs.appendFileSync(path.join(__dirname, '../../compare_output.txt'), 'All comparisons passed!\n');
  console.log('All comparisons passed!');
}
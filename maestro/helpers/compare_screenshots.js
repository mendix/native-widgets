/* eslint-disable @typescript-eslint/explicit-function-return-type */
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

const ignoredAreas = [
  { x: 0, y: actualImg.height - 35, width: actualImg.width, height: 35 } // Ignore bottom 35 pixels where is Home Indicator on iOS
];

function isIgnored(x, y) {
  return ignoredAreas.some(area => 
    x >= area.x && x < area.x + area.width && y >= area.y && y < area.y + area.height
  );
}

const failedComparisons = [];

fs.readdirSync(actualDir).forEach(file => {
  const actualPath = path.join(actualDir, file);
  const expectedPath = path.join(expectedDir, file);
  const diffPath = path.join(diffDir, `diff_${file}`);

  if (fs.exists(expectedPath)) {
    const actualImg = PNG.sync.read(fs.readFileSync(actualPath));
    const expectedImg = PNG.sync.read(fs.readFileSync(expectedPath));
    const { width, height } = actualImg;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(actualImg.data, expectedImg.data, diff.data, width, height, { 
      threshold: 0.1,
      includeAA: false,
      diffMask: true
    }, (x, y) => isIgnored(x, y));

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
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
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

function isIgnored(x, y, ignoredAreas) {
  return ignoredAreas.some(area => 
    x >= area.x && x < area.x + area.width && y >= area.y && y < area.y + area.height
  );
}

function applyIgnoredAreas(img, ignoredAreas) {
  const { width, height } = img;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isIgnored(x, y, ignoredAreas)) {
        const idx = (width * y + x) << 2;
        img.data[idx] = 0;     // R
        img.data[idx + 1] = 0; // G
        img.data[idx + 2] = 0; // B
        img.data[idx + 3] = 0; // A (transparent)
      }
    }
  }
}

const failedComparisons = [];

fs.readdirSync(actualDir).forEach(file => {
  const actualPath = path.join(actualDir, file);
  const expectedPath = path.join(expectedDir, file);
  const diffPath = path.join(diffDir, `diff_${file}`);

  if (fs.existsSync(expectedPath)) {
    const actualImg = PNG.sync.read(fs.readFileSync(actualPath));
    const expectedImg = PNG.sync.read(fs.readFileSync(expectedPath));
    const { width, height } = actualImg;
    const diff = new PNG({ width, height });

    let ignoredAreas = [];
    if (platform === 'ios') {
      ignoredAreas = [
        { x: 0, y: height - 40, width, height: 40 } // Ignore bottom 40 pixels where is Home Indicator on iOS
      ];
    } else if (platform === 'android') {
      ignoredAreas = [
        { x: 0, y: 0, width, height: 50 }, // Ignore top 50 pixels on Android
        { x: width - 15, y: 0, width: 15, height } // Ignore right 15 pixels on Android
      ];
    }

    applyIgnoredAreas(actualImg, ignoredAreas);
    applyIgnoredAreas(expectedImg, ignoredAreas);

    const numDiffPixels = pixelmatch(actualImg.data, expectedImg.data, diff.data, width, height, { 
      threshold: 0.1,
      includeAA: false,
      diffMask: true
    });

    const toleranceAmount = 0.02; // 2%
    const totalPixels = width * height;
    const pixelTolerance = Math.floor(totalPixels * toleranceAmount);

    if (numDiffPixels > pixelTolerance) {
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      failedComparisons.push(file);
      console.log(`❌ Comparison failed for ${file} (diff: ${numDiffPixels} > tolerance: ${pixelTolerance})`);
    } else {
      fs.appendFileSync(path.join(__dirname, '../../compare_output.txt'), `✅ Comparison passed for ${file}\n`);
      console.log(`✅ Comparison passed for ${file} (diff: ${numDiffPixels} <= tolerance: ${pixelTolerance})`);
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
/**
 * Bundle analysis script.
 * Generates bundle size data and optionally reports to the performance API.
 *
 * Usage:
 *   ANALYZE_BUNDLE=true npm run build:ui
 *   node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DIST_DIR = path.resolve(__dirname, '..', 'dist', 'src', 'client');
const API_URL = process.env.API_URL || 'http://localhost:3000';

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function analyzeDirectory(dir) {
  const modules = [];
  let totalSize = 0;

  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && /\.(js|css|map)$/.test(file)) {
      const size = stat.size;
      totalSize += size;

      modules.push({
        name: file,
        path: filePath,
        size,
        gzippedSize: Math.round(size * 0.3), // Estimate
        isInitial: !file.includes('chunk'),
      });
    }
  }

  return { modules, totalSize };
}

async function main() {
  const { modules, totalSize } = analyzeDirectory(DIST_DIR);
  const gzippedSize = Math.round(totalSize * 0.3);

  console.log('\nBundle Analysis:');
  console.log(`  Total size: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`  Estimated gzipped: ${(gzippedSize / 1024).toFixed(1)} KB`);
  console.log(`  Files: ${modules.length}`);
  console.log('');

  modules
    .sort((a, b) => b.size - a.size)
    .forEach((mod) => {
      console.log(`  ${mod.name}: ${(mod.size / 1024).toFixed(1)} KB`);
    });

  // Optionally report to API
  if (process.env.REPORT_BUNDLE === 'true') {
    try {
      await axios.post(`${API_URL}/api/performance/bundle`, {
        totalSize,
        gzippedSize,
        modules,
        generatedAt: new Date().toISOString(),
      });
      console.log('\nBundle data reported to API.');
    } catch (err) {
      console.error('\nFailed to report bundle data:', err.message);
    }
  }
}

main();

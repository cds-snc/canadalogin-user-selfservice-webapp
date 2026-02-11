import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Conversion patterns
const CONVERSIONS = [
  { from: /from\s+["'](.+?)\.jsx["']/g, to: 'from "$1"' },
  { from: /from\s+["'](.+?)\.js["']/g, to: 'from "$1"' },
  { from: /import\s+PropTypes\s+from\s+["']prop-types["'];?\n?/g, to: '' },
  { from: /\w+\.propTypes\s*=\s*\{[\s\S]*?\};?\n?/g, to: '' },
];

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  CONVERSIONS.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  const newExt = filePath.endsWith('.jsx') ? '.tsx' : '.ts';
  const newPath = filePath.replace(/\.jsx?$/, newExt);
  
  fs.writeFileSync(newPath, content);
  fs.unlinkSync(filePath);
  
  console.log(`✓ ${path.basename(newPath)}`);
  return { oldPath: filePath, newPath };
}

// Convert specific remaining files
const files = [
  'src/router.jsx',
  'src/setup-msw.js', 
  'src/setupTests.js',
  'src/stories/Tests/utils/PageRenderer.jsx',
  'src/stories/Tests/utils/constants.jsx',
  'src/stories/Tests/utils/gcdsTestHelpers.js'
];

console.log(`\nConverting ${files.length} remaining files...\n`);

for (const file of files) {
  try {
    if (fs.existsSync(file)) {
      convertFile(file);
    } else {
      console.log(`⚠ ${file} not found`);
    }
  } catch (error) {
    console.error(`✗ ${file}: ${error.message}`);
  }
}

console.log('\n✅ Done');

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

// Convert remaining component files
const files = globSync('src/components/**/*.{js,jsx}', { cwd: process.cwd() });

console.log(`\nConverting ${files.length} component files...\n`);

for (const file of files) {
  try {
    convertFile(file);
  } catch (error) {
    console.error(`✗ ${file}: ${error.message}`);
  }
}

console.log('\n✅ Done');

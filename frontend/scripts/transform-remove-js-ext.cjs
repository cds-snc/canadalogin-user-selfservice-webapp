const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const targetArgIndex = args.findIndex(a => a === '--path');
const targetDir = targetArgIndex >=0 && args[targetArgIndex+1] ? args[targetArgIndex+1] : 'src';
const ROOT = path.resolve(__dirname, '..');
const SEARCH_DIRS = [path.join(ROOT, targetDir), path.join(ROOT, 'stories'), path.join(ROOT, 'public')];

function isTextFile(file) {
  return /\.(js|jsx|ts|tsx|mjs|cjs|json|md|html)$/.test(file);
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and .git
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.pi') continue;
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

const fileList = SEARCH_DIRS.reduce((all, dir) => {
  try { return all.concat(walk(dir)); } catch(e) { return all; }
}, []).filter(f => isTextFile(f));

const importRegex = /(['"])(\.\.?\/?[^'"\n]+?)\.(js|jsx)\1/g; // capture groups: quote, path without ext, ext

let total = 0;
let changedFiles = 0;
const changes = [];

for (const file of fileList) {
  let content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(importRegex, (m, q, p, ext) => {
    // do not change if path looks like a URL (starts with http) or includes a dot for extension other than js/jsx
    if (/^https?:\/\//.test(p)) return m;
    return q + p + q;
  });

  if (newContent !== content) {
    total += (content.match(importRegex) || []).length;
    changedFiles += 1;
    changes.push({ file: path.relative(ROOT, file) });
    if (apply) {
      fs.writeFileSync(file, newContent, 'utf8');
    }
  }
}

console.log(`${apply ? 'Applied' : 'Dry-run'}: found ${total} import specifiers across ${changedFiles} files.`);
if (changes.length) console.log(changes.map(c => '- ' + c.file).join('\n'));
if (!apply) console.log('\nRun with --apply to write changes. Example: node scripts/transform-remove-js-ext.cjs --path src --apply');

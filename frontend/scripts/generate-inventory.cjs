const fs = require('fs');
const path = require('path');

const walk = (dir, files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const srcDir = path.join(__dirname, '..', 'src');
const files = walk(srcDir);
const out = files.map((f) => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n').length;
  const size = Buffer.byteLength(content, 'utf8');
  const ext = path.extname(f).slice(1);
  return { path: f, ext, lines, size };
});

const outPath = path.join(__dirname, '..', 'migration', 'inventory.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out.sort((a,b)=>b.lines-a.lines), null, 2));
console.log('Wrote', outPath);

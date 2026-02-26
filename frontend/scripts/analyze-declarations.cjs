const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES_DIR = path.join(ROOT, 'types-extracted');
const OUT_DIR = path.join(ROOT, 'migration');
const OUT_JSON = path.join(OUT_DIR, 'declarations-report.json');
const OUT_MD = path.join(OUT_DIR, 'declarations-report.md');

function findDtsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findDtsFiles(full));
    else if (e.isFile() && full.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

function parseExports(content) {
  const interfaces = [];
  const types = [];
  const enums = [];
  const funcs = [];
  const vars = [];
  let defaultExport = null;

  // simple regex-based extraction (good enough for short report)
  const ifaceRE = /export\s+(?:declare\s+)?interface\s+(\w+)/g;
  const typeRE = /export\s+(?:declare\s+)?type\s+(\w+)/g;
  const enumRE = /export\s+(?:declare\s+)?enum\s+(\w+)/g;
  const funcRE = /export\s+function\s+(\w+)/g;
  const varRE = /export\s+(?:declare\s+)?(?:const|let|var)\s+(\w+)/g;
  const defaultRE = /export\s+default\s+(interface|class|function)?\s*(?:([A-Za-z0-9_]+))?/g;

  let m;
  while ((m = ifaceRE.exec(content))) interfaces.push(m[1]);
  while ((m = typeRE.exec(content))) types.push(m[1]);
  while ((m = enumRE.exec(content))) enums.push(m[1]);
  while ((m = funcRE.exec(content))) funcs.push(m[1]);
  while ((m = varRE.exec(content))) vars.push(m[1]);
  while ((m = defaultRE.exec(content))) {
    if (m[2]) defaultExport = m[2];
    else defaultExport = 'default';
  }

  return { interfaces, types, enums, funcs, vars, defaultExport };
}

function generateReport() {
  if (!fs.existsSync(TYPES_DIR)) {
    console.error(`types-extracted directory not found: ${TYPES_DIR}`);
    console.error('Run `npm run extract:types` in the frontend folder first.');
    process.exit(2);
  }

  const files = findDtsFiles(TYPES_DIR);
  const results = [];
  for (const f of files) {
    const rel = path.relative(TYPES_DIR, f);
    const content = fs.readFileSync(f, 'utf8');
    const stats = fs.statSync(f);
    const exports = parseExports(content);
    const exportCount =
      exports.interfaces.length +
      exports.types.length +
      exports.enums.length +
      exports.funcs.length +
      exports.vars.length +
      (exports.defaultExport ? 1 : 0);

    results.push({ file: rel, size: stats.size, exportCount, exports });
  }

  results.sort((a, b) => b.exportCount - a.exportCount || b.size - a.size);

  const summary = {
    generatedAt: new Date().toISOString(),
    totalFiles: results.length,
    totalExports: results.reduce((s, r) => s + r.exportCount, 0),
    files: results,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2), 'utf8');

  // Markdown report
  const lines = [];
  lines.push('# Declarations extraction report');
  lines.push('');
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push('');
  lines.push(`Total declaration files: ${summary.totalFiles}`);
  lines.push(`Total exported symbols (approx): ${summary.totalExports}`);
  lines.push('');
  lines.push('## Top files by exported symbols');
  lines.push('');
  for (const r of summary.files.slice(0, 50)) {
    lines.push(`- **${r.file}** — exports: ${r.exportCount}, size: ${r.size} bytes`);
    const ex = r.exports;
    const parts = [];
    if (ex.interfaces.length) parts.push(`interfaces: ${ex.interfaces.join(', ')}`);
    if (ex.types.length) parts.push(`types: ${ex.types.join(', ')}`);
    if (ex.enums.length) parts.push(`enums: ${ex.enums.join(', ')}`);
    if (ex.funcs.length) parts.push(`functions: ${ex.funcs.join(', ')}`);
    if (ex.vars.length) parts.push(`vars: ${ex.vars.join(', ')}`);
    if (ex.defaultExport) parts.push(`default: ${ex.defaultExport}`);
    if (parts.length) lines.push(`  - ${parts.join(' | ')}`);
  }

  lines.push('');
  lines.push('## Recommendation (automated)');
  lines.push('');
  lines.push('Promote high-confidence exported `interface` and `type` declarations into frontend/src/types/ as domain types.');
  lines.push('For each file above, consider creating a corresponding file under src/types/ and exporting the interfaces/types from there.');

  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');
  console.log('Wrote report:', OUT_JSON, OUT_MD);
}

generateReport();

#!/usr/bin/env node
/**
 * Batch TypeScript Conversion Script (ES Module version)
 * 
 * Converts files in phases and provides better error handling
 * 
 * Usage: node scripts/batch-convert.js [phase]
 * Phases: services, hooks, providers, layouts, features, tests, stories
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PHASES = {
  services: {
    pattern: 'src/services/**/*.{js,jsx}',
    description: 'Service and API layer files'
  },
  hooks: {
    pattern: 'src/hooks/**/*.{js,jsx}',
    description: 'Custom React hooks'
  },
  providers: {
    pattern: 'src/components/Providers/*.{js,jsx}',
    description: 'Context providers'
  },
  layouts: {
    pattern: 'src/components/Layout/*.{js,jsx}',
    description: 'Layout components'
  },
  features: {
    pattern: 'src/features/**/*.{js,jsx}',
    description: 'Feature modules'
  },
  tests: {
    pattern: 'src/**/*.test.{js,jsx}',
    description: 'Test files'
  },
  stories: {
    pattern: 'src/**/*.stories.{js,jsx}',
    description: 'Storybook stories'
  },
  entry: {
    pattern: 'src/{main,routes}.{js,jsx}',
    description: 'Entry point files'
  }
};

// Common conversion patterns
const CONVERSIONS = [
  // Remove .jsx/.js from imports
  { from: /from\s+["'](.+?)\.jsx["']/g, to: 'from "$1"' },
  { from: /from\s+["'](.+?)\.js["']/g, to: 'from "$1"' },
  
  // Remove PropTypes
  { from: /import\s+PropTypes\s+from\s+["']prop-types["'];?\n?/g, to: '' },
  { from: /\w+\.propTypes\s*=\s*\{[\s\S]*?\};?\n?/g, to: '' },
  
  // Common type annotations for hooks
  { from: /const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState\s*\(\s*["']/, to: 'const [$1, $2] = useState<string>("' },
  { from: /const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState\s*\(\s*(\d+)\s*\)/, to: 'const [$1, $2] = useState<number>($3)' },
  { from: /const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState\s*\(\s*(true|false)\s*\)/, to: 'const [$1, $2] = useState<boolean>($3)' },
  { from: /const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState\s*\(\s*\[\s*\]\s*\)/, to: 'const [$1, $2] = useState<unknown[]>([])' },
  { from: /const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*useState\s*\(\s*\{\s*\}\s*\)/, to: 'const [$1, $2] = useState<Record<string, unknown>>({})' },
];

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Apply conversions
  CONVERSIONS.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  // Determine new extension
  const newExt = filePath.endsWith('.jsx') ? '.tsx' : '.ts';
  const newPath = filePath.replace(/\.jsx?$/, newExt);
  
  // Write and cleanup
  fs.writeFileSync(newPath, content);
  fs.unlinkSync(filePath);
  
  return { oldPath: filePath, newPath };
}

function runPhase(phaseName) {
  const phase = PHASES[phaseName];
  if (!phase) {
    console.error(`Unknown phase: ${phaseName}`);
    console.log(`Available phases: ${Object.keys(PHASES).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`\n🔧 Phase: ${phaseName}`);
  console.log(`Description: ${phase.description}`);
  console.log(`Pattern: ${phase.pattern}\n`);
  
  const files = globSync(phase.pattern, { cwd: process.cwd() });
  
  if (files.length === 0) {
    console.log('No files found.\n');
    return [];
  }
  
  console.log(`Found ${files.length} files`);
  
  const results = [];
  for (const file of files) {
    try {
      const result = convertFile(file);
      results.push(result);
      console.log(`  ✓ ${path.basename(result.newPath)}`);
    } catch (error) {
      console.error(`  ✗ ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Converted ${results.length}/${files.length} files`);
  return results;
}

function main() {
  const phase = process.argv[2];
  
  if (!phase) {
    console.log('\n📦 Batch TypeScript Conversion Tool\n');
    console.log('Usage: node scripts/batch-convert.js <phase>\n');
    console.log('Available phases:');
    Object.entries(PHASES).forEach(([name, info]) => {
      console.log(`  ${name.padEnd(12)} - ${info.description}`);
    });
    console.log('\nOr run all phases:');
    console.log('  node scripts/batch-convert.js all\n');
    process.exit(0);
  }
  
  if (phase === 'all') {
    console.log('\n🚀 Running all phases...\n');
    const allResults = [];
    for (const phaseName of Object.keys(PHASES)) {
      const results = runPhase(phaseName);
      allResults.push(...results);
    }
    console.log(`\n🏁 Total: ${allResults.length} files converted`);
  } else {
    runPhase(phase);
  }
  
  console.log('\nNext steps:');
  console.log('  1. Run: npx tsc --noEmit');
  console.log('  2. Fix type errors');
  console.log('  3. Run: npm test');
}

main();

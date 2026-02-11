#!/usr/bin/env node
/**
 * TypeScript Conversion Script
 * 
 * Automates the repetitive parts of converting .jsx/.js to .tsx/.ts
 * 
 * Usage: node scripts/convert-to-typescript.js [path-pattern]
 * Example: node scripts/convert-to-typescript.js "src/components/**/*.jsx"
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// Patterns for common conversions
const CONVERSIONS = {
  // Import extensions - remove .jsx/.js from imports
  importExtensions: [
    { from: /from\s+["'](.+?)\.jsx["']/g, to: 'from "$1"' },
    { from: /from\s+["'](.+?)\.js["']/g, to: 'from "$1"' },
  ],
  
  // React imports
  reactImports: [
    { from: /import\s+React\s+from\s+["']react["'];?/g, to: 'import React from "react";' },
    { from: /import\s+\{\s*useState\s*\}\s+from\s+["']react["'];?/g, to: 'import { useState } from "react";' },
    { from: /import\s+\{\s*useEffect\s*\}\s+from\s+["']react["'];?/g, to: 'import { useEffect } from "react";' },
  ],
  
  // Remove PropTypes imports and declarations
  removePropTypes: [
    { from: /import\s+PropTypes\s+from\s+["']prop-types["'];?\n?/g, to: '' },
    { from: /\w+\.propTypes\s*=\s*\{[\s\S]*?\};?\n?/g, to: '' },
  ],
  
  // Add type imports for utils
  typeImports: [
    { 
      from: /from\s+["']\.\.\/types["']/g, 
      to: 'from "../types"'
    },
  ],
};

function convertFile(filePath) {
  console.log(`Converting: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Apply all conversions
  Object.values(CONVERSIONS).flat().forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  // Determine new file path
  const newExt = filePath.endsWith('.jsx') ? '.tsx' : '.ts';
  const newPath = filePath.replace(/\.jsx?$/, newExt);
  
  // Write new file
  fs.writeFileSync(newPath, content);
  
  // Remove old file
  fs.unlinkSync(filePath);
  
  console.log(`  → ${newPath}`);
  
  return {
    oldPath: filePath,
    newPath: newPath,
    changed: content !== originalContent
  };
}

function main() {
  const pattern = process.argv[2] || 'src/**/*.jsx';
  
  console.log(`\n🔧 TypeScript Conversion Tool`);
  console.log(`Pattern: ${pattern}\n`);
  
  const files = globSync(pattern, { cwd: process.cwd() });
  
  if (files.length === 0) {
    console.log('No files found matching pattern.');
    process.exit(0);
  }
  
  console.log(`Found ${files.length} files to convert\n`);
  
  const results = [];
  
  for (const file of files) {
    try {
      const result = convertFile(file);
      results.push(result);
    } catch (error) {
      console.error(`Error converting ${file}:`, error.message);
    }
  }
  
  console.log(`\n✅ Converted ${results.length} files`);
  console.log('\nNext steps:');
  console.log('  1. Run type checker: npx tsc --noEmit');
  console.log('  2. Fix any remaining type errors manually');
  console.log('  3. Run tests: npm test');
}

main();

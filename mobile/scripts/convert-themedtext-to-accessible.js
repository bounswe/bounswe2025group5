#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function processFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  if (!/ThemedText/.test(src)) return false; // nothing to do
  if (/components\/AccessibleText/.test(src)) return false; // already migrated/imports AccessibleText

  // Replace import lines safely
  const themedImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]@\/components\/ThemedText['"];?/g;
  if (themedImportRegex.test(src)) {
    src = src.replace(themedImportRegex, (m, group1) => {
      const imports = group1.split(',').map(s => s.trim()).filter(Boolean);
      const remaining = imports.filter(i => i !== 'ThemedText');
      let out = '';
      if (remaining.length) {
        out += `import { ${remaining.join(', ')} } from '@/components/ThemedText';\n`;
      }
      out += "import AccessibleText from '@/components/AccessibleText';";
      return out;
    });
  } else {
    // If there's a default import or different form, try to replace direct import
    const simpleImport = /import\s+ThemedText\s+from\s+['"]@\/components\/ThemedText['"];?/g;
    if (simpleImport.test(src)) {
      src = src.replace(simpleImport, "import AccessibleText from '@/components/AccessibleText';");
    }
  }

  // Add import if file used ThemedText but didn't import (edge-case)
  if (!/AccessibleText/.test(src) && /<\s*ThemedText\b/.test(src)) {
    // inject import at top after other imports
    const firstImport = src.search(/import\s.+from\s.+;\s*/);
    if (firstImport !== -1) {
      const insertAt = src.indexOf('\n', firstImport) + 1;
      src = src.slice(0, insertAt) + "import AccessibleText from '@/components/AccessibleText';\n" + src.slice(insertAt);
    } else {
      src = "import AccessibleText from '@/components/AccessibleText';\n" + src;
    }
  }

  // Replace tags
  src = src.replace(/<\s*ThemedText(\b)/g, '<AccessibleText$1');
  src = src.replace(/<\s*\/\s*ThemedText\s*>/g, '</AccessibleText>');

  fs.writeFileSync(file, src, 'utf8');
  return true;
}

function findFiles() {
  const patterns = [
    'mobile/app/**/*.tsx',
    'mobile/app/**/*.ts',
    'mobile/components/**/*.tsx',
  ];
  const files = new Set();
  for (const p of patterns) {
    glob.sync(p, { nodir: true, ignore: ['**/node_modules/**', '**/archive/**'] }).forEach(f => files.add(f));
  }
  return Array.from(files);
}

const files = findFiles();
console.log('Found', files.length, 'files.');
let changed = 0;
for (const f of files) {
  try {
    const did = processFile(f);
    if (did) {
      console.log('Updated', f);
      changed++;
    }
  } catch (e) {
    console.error('Error processing', f, e);
  }
}

console.log('Migration complete. Files changed:', changed);

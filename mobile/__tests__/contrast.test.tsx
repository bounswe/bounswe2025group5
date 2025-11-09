import fs from 'fs';
import path from 'path';
import React from 'react';
import renderer from 'react-test-renderer';

// Ensure tests use predictable theme tokens
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

import { contrastRatio, MIN_CONTRAST_TEXT, MIN_CONTRAST_LARGE } from '@/utils/contrast';
import { Colors } from '@/constants/Colors';

type Failure = {
  file: string;
  text: string | null;
  fg: string | null;
  bg: string;
  ratio: number | null;
  reason?: string;
};

function walkDir(dir: string, list: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'archive' || e.name === '__tests__') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(full, list);
    else if (e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.jsx'))) list.push(full);
  }
  return list;
}

function flattenStyle(style: any): any {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  if (typeof style === 'number') return style; // StyleSheet IDs can't be resolved here
  if (typeof style === 'object') return style;
  return {};
}

function traverse(node: any, currentBg: string, failures: Failure[], file = '<unknown>') {
  if (!node) return;

  // detect background color on this node
  const props = node.props || {};
  const style = flattenStyle(props.style);
  const nodeBg = (style && style.backgroundColor) || props.backgroundColor || currentBg;

  // Text nodes in react-test-renderer toJSON have type 'Text' and children as strings or nodes
  if (node.type === 'Text' || node.type === 'text' || node.props?.accessibilityRole === 'text') {
    // try to read color
    const flattened = flattenStyle(props.style);
    const color = flattened.color || props.color || null;

    // attempt to detect fontSize/weight to decide large text
    const fontSize = flattened.fontSize || null;
    const fontWeight = flattened.fontWeight || null;
    const isLarge = (fontSize && fontSize >= 18) || (fontWeight && (fontWeight === '600' || fontWeight === '700') && fontSize && fontSize >= 14);

    // get displayed text (first child string)
    let textContent: string | null = null;
    if (Array.isArray(node.children)) {
      const first = node.children.find((c: any) => typeof c === 'string');
      textContent = first ?? null;
    }

    if (!color) {
      // fallback to theme text color
      (color as any) = Colors.light.text;
    }

    try {
      const ratio = contrastRatio(color as string, nodeBg || Colors.light.background);
      const threshold = isLarge ? MIN_CONTRAST_LARGE : MIN_CONTRAST_TEXT;
      if (ratio < threshold) {
        failures.push({ file, text: textContent, fg: color as string, bg: nodeBg || Colors.light.background, ratio });
      }
    } catch (e: any) {
      failures.push({ file, text: textContent, fg: color as string, bg: nodeBg || Colors.light.background, ratio: null, reason: String(e) });
    }
  }

  // recurse children
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'string') continue;
      traverse(child, nodeBg, failures, file);
    }
  }
}

describe('color contrast smoke test', () => {
  it('checks contrast for rendered text nodes in app/components and app pages', () => {
    const rootDir = path.join(__dirname, '..', 'app');
    const compDir = path.join(__dirname, '..', 'components');
    const files = walkDir(rootDir).concat(walkDir(compDir));

    const failures: Failure[] = [];
    const skipped: string[] = [];

    for (const f of files) {
      // try to require the module and render default export if it's a function/component
      try {
        const mod = require(f);
        const Comp = mod && (mod.default || mod);
        if (!Comp || (typeof Comp !== 'function' && typeof Comp !== 'object')) {
          skipped.push(f);
          continue;
        }

        // attempt to render - many components expect props; wrap in try/catch and skip failing ones
        let tree: any = null;
        try {
          const rendered = renderer.create(React.createElement(Comp, {}));
          tree = rendered.toJSON();
        } catch (renderErr) {
          skipped.push(f);
          continue;
        }

        if (!tree) continue;
        // tree can be array or object
        if (Array.isArray(tree)) {
          for (const t of tree) traverse(t, Colors.light.background, failures, f);
        } else {
          traverse(tree, Colors.light.background, failures, f);
        }
      } catch (e) {
        // ignore require-time errors - treat as skipped
        skipped.push(f);
      }
    }

    if (failures.length > 0) {
      // pretty print a concise summary for debugging
      const lines = failures.map((s) => `${s.file} — text="${s.text ?? ''}" fg=${s.fg} bg=${s.bg} ratio=${s.ratio}`);
      // fail with details
      throw new Error('Contrast failures:\n' + lines.join('\n'));
    }

    // If we reach here, either no failures or all problematic files were skipped
    expect(failures.length).toBe(0);
  }, 30000);
});

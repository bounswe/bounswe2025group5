#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Simple WCAG contrast utilities (same math as runtime helper)
function hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace('#', '').trim();
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  if (L1 == null || L2 == null) return null;
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return +( (lighter + 0.05) / (darker + 0.05) ).toFixed(2);
}

// Parse Colors.ts to extract Colors.light and Colors.dark tokens
function parseColors(colorsPath) {
  const txt = fs.readFileSync(colorsPath, 'utf8');
  const lightMatch = txt.match(/light:\s*\{([\s\S]*?)\},\n\s*dark:/m);
  const darkMatch = txt.match(/dark:\s*\{([\s\S]*?)\}\s*\};/m);
  const parseBlock = (block) => {
    const obj = {};
    if (!block) return obj;
    const re = /([a-zA-Z0-9_]+)\s*:\s*'?(#?[0-9A-Fa-f]{3,6})'?\s*,?/g;
    let m;
    while ((m = re.exec(block))) {
      obj[m[1]] = m[2].startsWith('#') ? m[2] : '#' + m[2];
    }
    return obj;
  };
  return { light: parseBlock(lightMatch && lightMatch[1]), dark: parseBlock(darkMatch && darkMatch[1]) };
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (['node_modules', 'archive', '__tests__'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.jsx'))) files.push(full);
  }
  return files;
}

function findTextUsages(fileContent) {
  const usages = [];
  const tagRe = /<(ThemedText|AccessibleText|Text)([\s\S]*?)>/g;
  let m;
  while ((m = tagRe.exec(fileContent))) {
    const tag = m[1];
    const attrs = m[2];
    const start = m.index;
    usages.push({ tag, attrs, start });
  }
  return usages;
}

function extractColorFromAttrs(attrs) {
  // try to find color prop e.g. color={'#fff'} or style={{ color: '#fff' }} or lightColor='#fff'
  const hexRe = /(['\"])(#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}))\1/;
  const colorPropRe = /color\s*=\s*\{?\s*(['\"]?#[0-9A-Fa-f]{3,6}['\"]?)\s*\}?/;
  const lightColorRe = /lightColor\s*=\s*(['\"])(#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}))\1/;
  const darkColorRe = /darkColor\s*=\s*(['\"])(#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}))\1/;
  const colorsObj = {};
  const mLight = attrs.match(lightColorRe);
  if (mLight) colorsObj.lightColor = mLight[2];
  const mDark = attrs.match(darkColorRe);
  if (mDark) colorsObj.darkColor = mDark[2];

  const mColorProp = attrs.match(colorPropRe);
  if (mColorProp) {
    const raw = mColorProp[1].replace(/['\{\}]/g, '');
    if (raw.startsWith('#')) colorsObj.color = raw;
  }

  // style={{ color: '#fff' }}
  const styleColorRe = /style\s*=\s*\{\s*\{[\s\S]*?color\s*:\s*(['\"])(#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}))\1[\s\S]*?\}\s*\}/m;
  const mStyle = attrs.match(styleColorRe);
  if (mStyle) colorsObj.color = mStyle[2];

  // Colors.light.text or Colors.light.cardBackground
  const tokenRe = /Colors\.(light|dark)\.([a-zA-Z0-9_]+)/g;
  const tokens = [];
  let t;
  while ((t = tokenRe.exec(attrs))) tokens.push({ theme: t[1], token: t[2] });
  if (tokens.length) colorsObj.tokens = tokens;

  return colorsObj;
}

function hasBackgroundProp(attrs) {
  if (!attrs) return false;
  return /backgroundColor\s*=|backgroundToken\s*=/.test(attrs);
}

function hasDynamicColorInStyle(attrs) {
  // matches style={{ color: someVar }} or style={[..., { color: someVar }]} where someVar is not a literal '#...' or Colors.
  if (!attrs) return false;
  const styleColorVarRe = /color\s*:\s*([^,}\]]+)/m;
  const m = attrs.match(styleColorVarRe);
  if (!m) return false;
  const val = m[1].trim();
  // if literal string or hex or Colors.<token>, consider non-dynamic
  if (/^['"]#/.test(val) || /^#/.test(val) || /Colors\./.test(val) || /^['"]/.test(val)) return false;
  return true;
}

function resolveToken(tokenObj, colorsMap) {
  if (!tokenObj) return null;
  if (tokenObj.color) return tokenObj.color;
  if (tokenObj.tokens && tokenObj.tokens.length) {
    // prefer light theme tokens
    const t = tokenObj.tokens.find(x => x.theme === 'light') || tokenObj.tokens[0];
    return colorsMap[t.theme] && colorsMap[t.theme][t.token];
  }
  if (tokenObj.lightColor) return tokenObj.lightColor;
  return null;
}

function run() {
  const projectRoot = path.resolve(__dirname, '..');
  const colorsPath = path.join(projectRoot, 'constants', 'Colors.ts');
  if (!fs.existsSync(colorsPath)) {
    console.error('Colors.ts not found at', colorsPath);
    process.exit(2);
  }
  const colorsMap = parseColors(colorsPath);

  const searchDirs = [path.join(projectRoot, 'app'), path.join(projectRoot, 'components')];
  const files = [];
  for (const d of searchDirs) if (fs.existsSync(d)) walk(d, files);

  const failures = [];
  const themes = ['light', 'dark'];
  const dynamicFailures = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    const usages = findTextUsages(txt);
    for (const u of usages) {
      // flag AccessibleText/ThemedText that use a dynamic color in style but don't pass a background prop
      if ((u.tag === 'AccessibleText' || u.tag === 'ThemedText') && hasDynamicColorInStyle(u.attrs) && !hasBackgroundProp(u.attrs)) {
        dynamicFailures.push({ file: f, tag: u.tag, attrs: u.attrs });
        continue;
      }
      const info = extractColorFromAttrs(u.attrs);
      const fg = resolveToken(info, colorsMap) || info.color || colorsMap.light.text;
      const threshold = 4.5; // normal text
      for (const theme of themes) {
        const bgMain = (colorsMap[theme] && colorsMap[theme].background) || '#ffffff';
        const bgCard = (colorsMap[theme] && colorsMap[theme].cardBackground) || '#ffffff';
        const ratioMain = contrastRatio(fg, bgMain);
        const ratioCard = contrastRatio(fg, bgCard);
        if ((ratioMain != null && ratioMain < threshold) && (ratioCard != null && ratioCard < threshold)) {
          failures.push({ file: f, tag: u.tag, fg, ratioMain, ratioCard, theme });
        }
      }
    }
  }

  if (failures.length) {
    console.error('Contrast lint found failures:');
    for (const s of failures) {
      console.error(`${s.file} [${s.theme}] — <${s.tag}> fg=${s.fg} ratioAgainstBackground=${s.ratioMain} ratioAgainstCard=${s.ratioCard}`);
    }
    if (dynamicFailures.length) {
      console.error('\nAdditionally, the linter found text usages with dynamic style colors and no background prop (these can hide contrast issues):');
      for (const d of dynamicFailures) {
        console.error(`${d.file} — <${d.tag}> attrsSnippet=${String(d.attrs).slice(0, 120).replace(/\n/g, ' ')}...`);
      }
    }
    process.exit(1);
  }

  if (dynamicFailures.length) {
    console.error('Contrast lint: found dynamic-color-without-bg issues. Please add backgroundColor or backgroundToken to these components.');
    for (const d of dynamicFailures) {
      console.error(`  - ${d.file}  <${d.tag}>`);
    }
    process.exit(1);
  }

  console.log('Contrast lint: no obvious failures found. Scanned', files.length, 'files.');
  process.exit(0);
}

run();

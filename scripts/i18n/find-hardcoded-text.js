// Finds English text still written in the code (not in the locale files, not the legal text).
// Run from the project root: NODE_PATH=node_modules node scripts/i18n/find-hardcoded-text.js
// Prints a count per file and writes scripts/i18n/hardcoded-text.json with file, line and code.
// Route names, ids, keys, colours and backend words that are used for matching show up too; check the code column.
const fs = require('fs');
const path = require('path');
const { candidatesOf } = require('./scan.js');

function walk(d, acc = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(f)) acc.push(p.replace(/\\/g, '/'));
  }
  return acc;
}
const SKIP = [/src\/i18n\//, /features\/Legal\//];
const files = walk('src').filter(f => !SKIP.some(r => r.test(f)));
const TEXT_KINDS = new Set(['jsxtext', 'attr', 'prop', 'arg', 'fallback', 'ternary', 'expr', 'default', 'return', 'const', 'assign', 'list', 'piece-jsx', 'piece-template', 'fallback-short', 'prop-other', 'other:CallExpression', 'other:BinaryExpression']);
const lines = {};
const out = [];
for (const f of files) {
  let cands;
  try {
    cands = candidatesOf(f);
  } catch (e) {
    continue;
  }
  const src = (lines[f] = fs.readFileSync(f, 'utf8').split('\n'));
  for (const c of cands) {
    if (!TEXT_KINDS.has(c.kind)) continue;
    const text = c.text || '';
    if (/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+)+$/.test(text)) continue; // a key
    const line = (src[c.line - 1] || '').trim();
    // noise: colours, mime types, routes, code
    if (/rgba?\(|image\/|video\/|\.jpg|\.png|\.mp4|\bnavigate\(|fontFamily|Platform\./.test(line)) continue;
    if (/^(Card|Visa|Mastercard|Amex|Discover|Google|WhatsApp|Facebook|Instagram|LinkedIn|YouTube|TikTok|X \(Twitter\)|Apple|Samsung|Huawei|Xiaomi|OnePlus|Sony|Canon|Sonos|Haier|Audionic|iPhone.*|Galaxy.*|Pixel.*|\d.*)$/.test(text)) continue;
    out.push({ file: f.replace('src/', ''), line: c.line, kind: c.kind, text: text.slice(0, 80), code: line.slice(0, 110) });
  }
}
fs.writeFileSync(path.join(__dirname, 'hardcoded-text.json'), JSON.stringify(out, null, 1));
const byFile = {};
out.forEach(o => (byFile[o.file] = (byFile[o.file] || 0) + 1));
console.log('candidates', out.length);
console.log(Object.entries(byFile).sort((a, b) => b[1] - a[1]).map(([f, n]) => n + ' ' + f).join('\n'));

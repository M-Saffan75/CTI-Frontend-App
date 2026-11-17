// Joins layout-risks.json with the text length of each key. Run after find-layout-risks.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const load = lang => {
  const dir = path.join(__dirname, '..', '..', 'src', 'i18n', 'locales', lang);
  const tree = {};
  for (const f of fs.readdirSync(dir)) {
    if (f === 'index.ts') continue;
    const js = ts.transpileModule(fs.readFileSync(path.join(dir, f), 'utf8'), { compilerOptions: { module: 'commonjs' } }).outputText;
    const m = { exports: {} };
    new Function('module', 'exports', 'require', js)(m, m.exports, () => ({}));
    Object.assign(tree, m.exports.default);
  }
  return tree;
};
const en = load('en');
const tr = load('tr');
const get = (t, k) => k.split('.').reduce((n, p) => (n == null ? n : n[p]), t);
const rows = require('./layout-risks.json')
  .filter(r => r.key && typeof get(tr, r.key) === 'string')
  .map(r => ({ ...r, en: get(en, r.key), tr: get(tr, r.key) }))
  .map(r => ({ ...r, trLen: r.tr.length, enLen: r.en.length }));
fs.writeFileSync(path.join(__dirname, 'layout-risks-with-text.json'), JSON.stringify(rows, null, 1));
module.exports = { en, tr, get };
if (require.main === module) {
  rows.filter(r => r.trLen >= 14).sort((a, b) => b.trLen - a.trLen).forEach(r => console.log(r.trLen, r.file + ':' + r.line, r.key, '|', r.tr));
}

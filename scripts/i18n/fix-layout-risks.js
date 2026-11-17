// Fixes what find-layout-risks.js reports: flexShrink on texts in rows, one line fit for texts in fixed size boxes.
// Run: NODE_PATH=node_modules node scripts/i18n/fix-layout-risks.js [--write]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const WRITE = process.argv.includes('--write');
const SRC = path.join(__dirname, '..', '..', 'src');
const walk = (d, out = []) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(f)) out.push(p);
  }
  return out;
};
const nameOf = el => el.openingElement.name.name || (el.openingElement.name.property && el.openingElement.name.property.name);
const attr = (el, n) => el.openingElement.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === n);

const tableOf = ast => {
  const table = {};
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      if (!(c.type === 'MemberExpression' && c.object.name === 'StyleSheet' && c.property.name === 'create')) return;
      if (p.node.arguments[0]?.type !== 'ObjectExpression') return;
      for (const prop of p.node.arguments[0].properties) {
        if (prop.type === 'ObjectProperty' && prop.value.type === 'ObjectExpression') table[prop.key.name || prop.key.value] = prop.value;
      }
    },
  });
  return table;
};
const propsOf = (node, table, out = {}) => {
  if (!node) return out;
  if (node.type === 'JSXExpressionContainer') return propsOf(node.expression, table, out);
  if (node.type === 'ArrayExpression') node.elements.forEach(e => propsOf(e, table, out));
  else if (node.type === 'ConditionalExpression') {
    propsOf(node.consequent, table, out);
    propsOf(node.alternate, table, out);
  } else if (node.type === 'LogicalExpression') propsOf(node.right, table, out);
  else if (node.type === 'MemberExpression' && node.object.name === 'styles') {
    if (table[node.property.name]) propsOf(table[node.property.name], table, out);
  } else if (node.type === 'ObjectExpression') {
    for (const p of node.properties) {
      if (p.type !== 'ObjectProperty') continue;
      const v = p.value;
      out[p.key.name || p.key.value] = v.type === 'NumericLiteral' ? v.value : v.type === 'StringLiteral' ? v.value : true;
    }
  }
  return out;
};
const firstStyleRef = (node, table) => {
  if (!node) return null;
  if (node.type === 'JSXExpressionContainer') return firstStyleRef(node.expression, table);
  if (node.type === 'MemberExpression' && node.object.name === 'styles' && table[node.property.name]) return table[node.property.name];
  if (node.type === 'ArrayExpression') {
    for (const e of node.elements) {
      const r = firstStyleRef(e, table);
      if (r) return r;
    }
  }
  return null;
};
const usesText = el =>
  el.children.some(c => {
    if (c.type !== 'JSXExpressionContainer') return false;
    const e = c.expression;
    return e.type === 'CallExpression' && (e.callee.name === 't' || e.callee.name === 'tx' || (e.callee.type === 'MemberExpression' && e.callee.property.name === 't'));
  }) || nameOf(el) === 'Trans';

let total = 0;
for (const file of walk(SRC)) {
  if (/features[\\/]Legal[\\/]/.test(file)) continue;
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (e) {
    continue;
  }
  const nl = code.includes('\r\n') ? '\r\n' : '\n';
  const table = tableOf(ast);
  const edits = new Map();
  const seen = new Set();
  const insertShrink = obj => {
    if (seen.has(obj.start)) return;
    seen.add(obj.start);
    if (obj.properties.length === 0) return;
    const first = obj.properties[0];
    const between = code.slice(obj.start + 1, first.start);
    const multi = between.includes('\n');
    const text = multi ? 'flexShrink: 1,' + nl + between.slice(between.lastIndexOf('\n') + 1) : 'flexShrink: 1, ';
    edits.set(first.start, text);
  };

  traverse(ast, {
    JSXElement(p) {
      const el = p.node;
      if (nameOf(el) !== 'Text' || !usesText(el)) return;
      const styleAttr = attr(el, 'style');
      const style = propsOf(styleAttr?.value, table);
      const lines = attr(el, 'numberOfLines');
      const fits = attr(el, 'adjustsFontSizeToFit');
      const parent = p.parent.type === 'JSXElement' ? p.parent : null;
      if (!parent) return;
      const pStyle = propsOf(attr(parent, 'style')?.value, table);
      const siblings = parent.children.filter(c => c.type === 'JSXElement' || c.type === 'JSXExpressionContainer').length;

      if (pStyle.flexDirection === 'row' && siblings > 1 && !lines && !fits && !style.flex && !style.flexShrink && !pStyle.flexWrap) {
        const ref = firstStyleRef(styleAttr?.value, table);
        if (ref) insertShrink(ref);
        else if (styleAttr?.value.expression?.type === 'ObjectExpression') insertShrink(styleAttr.value.expression);
        else console.log('no style to change:', path.relative(SRC, file), el.loc.start.line);
      }
      const box = ['View', 'TouchableOpacity', 'Pressable', 'TouchableHighlight', 'TouchableWithoutFeedback'].includes(nameOf(parent));
      if (box && !lines && !fits) {
        if (typeof pStyle.height === 'number' && pStyle.height <= 64 && !pStyle.minHeight) edits.set(el.openingElement.name.end, ' numberOfLines={1} adjustsFontSizeToFit');
        else if (typeof pStyle.width === 'number' && pStyle.width < 140) edits.set(el.openingElement.name.end, ' numberOfLines={1} adjustsFontSizeToFit');
      }
    },
  });

  if (edits.size === 0) continue;
  total += edits.size;
  if (WRITE) {
    let out = code;
    for (const at of [...edits.keys()].sort((a, b) => b - a)) out = out.slice(0, at) + edits.get(at) + out.slice(at);
    fs.writeFileSync(file, out);
  }
  console.log(edits.size, path.relative(SRC, file));
}
console.log('edits', total, WRITE ? '(written)' : '(dry run)');

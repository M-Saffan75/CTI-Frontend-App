// Finds places where longer (Turkish) text can overflow or be cut.
// Run: NODE_PATH=node_modules node scripts/i18n/find-layout-risks.js   (writes scripts/i18n/layout-risks.json)
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const SRC = path.join(__dirname, '..', '..', 'src');
const walk = (d, out = []) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(f)) out.push(p);
  }
  return out;
};

const tableOf = ast => {
  const table = {};
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      const isCreate = c.type === 'MemberExpression' && c.object.name === 'StyleSheet' && c.property.name === 'create';
      if (!isCreate || p.node.arguments[0]?.type !== 'ObjectExpression') return;
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
    const o = table[node.property.name];
    if (o) propsOf(o, table, out);
  } else if (node.type === 'ObjectExpression') {
    for (const p of node.properties) {
      if (p.type !== 'ObjectProperty') continue;
      const k = p.key.name || p.key.value;
      const v = p.value;
      out[k] = v.type === 'NumericLiteral' ? v.value : v.type === 'StringLiteral' ? v.value : true;
    }
  }
  return out;
};

const attr = (el, name) => el.openingElement.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === name);
const nameOf = el => el.openingElement.name.name || (el.openingElement.name.property && el.openingElement.name.property.name);

const usesText = el =>
  el.children.some(c => {
    if (c.type !== 'JSXExpressionContainer') return false;
    const e = c.expression;
    return e.type === 'CallExpression' && ((e.callee.name === 't' || e.callee.name === 'tx') || (e.callee.type === 'MemberExpression' && e.callee.property.name === 't'));
  }) || nameOf(el) === 'Trans';

const out = [];
for (const file of walk(SRC)) {
  if (/features[\\/]Legal[\\/]/.test(file)) continue;
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (e) {
    continue;
  }
  const table = tableOf(ast);
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  const add = (node, kind, why, key) => out.push({ file: rel, line: node.loc.start.line, kind, why, key });

  traverse(ast, {
    JSXElement(p) {
      const el = p.node;
      const name = nameOf(el);
      if (name !== 'Text' || !usesText(el)) return;
      const style = propsOf(attr(el, 'style')?.value, table);
      const lines = attr(el, 'numberOfLines');
      const fits = attr(el, 'adjustsFontSizeToFit');
      const parent = p.parent.type === 'JSXElement' ? p.parent : null;
      const pStyle = parent ? propsOf(attr(parent, 'style')?.value, table) : {};
      const inRow = pStyle.flexDirection === 'row';
      const siblings = parent ? parent.children.filter(c => c.type === 'JSXElement' || c.type === 'JSXExpressionContainer').length : 0;

      if (style.height && !lines && !fits) add(el, 'fixed-height', 'Text has a fixed height and no numberOfLines');
      if (typeof style.width === 'number' && !lines && !fits) add(el, 'fixed-width', 'Text has a fixed width of ' + style.width);
      const keyOf = (el.children.map(c => c.type === 'JSXExpressionContainer' && c.expression.type === 'CallExpression' && c.expression.arguments[0] && c.expression.arguments[0].type === 'StringLiteral' ? c.expression.arguments[0].value : null).find(Boolean)) || (attr(el, 'i18nKey') && attr(el, 'i18nKey').value.value);
      if (inRow && siblings > 1 && !lines && !fits && !style.flex && !style.flexShrink && !pStyle.flexWrap) {
        add(el, 'row-no-shrink', 'Text in a row with siblings can push them out (no flex, flexShrink, wrap or numberOfLines)', keyOf);
      }
      if (lines && !fits && parent && (parent.children.length < 4) && Number(lines.value?.expression?.value) === 1) {
        add(el, 'one-line', 'numberOfLines=1 (cut with ... when the Turkish text is longer)');
      }
    },
    JSXOpeningElement(p) {
      const n = p.node.name.name;
      if (!['TouchableOpacity', 'Pressable', 'TouchableHighlight', 'View', 'TouchableWithoutFeedback'].includes(n)) return;
      const el = p.parent;
      const style = propsOf(attr(el, 'style')?.value, table);
      const hasText = el.children.some(c => c.type === 'JSXElement' && nameOf(c) === 'Text' && usesText(c));
      if (!hasText) return;
      const kids = el.children.filter(c => c.type === 'JSXElement' && nameOf(c) === 'Text').length;
      if (typeof style.width === 'number' && style.width < 140) add(p.node, 'fixed-width-box', 'Box with a fixed width of ' + style.width + ' holds text');
      if (typeof style.height === 'number' && style.height <= 64 && !style.minHeight) add(p.node, 'fixed-height-box', 'Box with a fixed height of ' + style.height + ' holds text (' + kids + ' text)');
    },
  });
}
fs.writeFileSync(path.join(__dirname, 'layout-risks.json'), JSON.stringify(out, null, 1));
const count = {};
out.forEach(o => (count[o.kind] = (count[o.kind] || 0) + 1));
console.log(out.length, count);

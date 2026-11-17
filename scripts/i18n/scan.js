// Finds user text in source files with the Babel parser (no code is changed).
// node scan.js out.json file1 file2 ...
const fs = require('fs');
const parser = require('@babel/parser');

const TEXT_ATTRS = new Set([
  'title', 'label', 'placeholder', 'message', 'subtitle', 'description', 'buttonText', 'confirmText', 'cancelText',
  'emptyText', 'text', 'header', 'heading', 'hint', 'caption', 'accessibilityLabel', 'retryLabel', 'endText',
  'secondaryButtonText', 'clearLabel', 'error', 'helper', 'sublabel', 'tabLabel',
]);
const TEXT_KEYS = new Set([...TEXT_ATTRS, 'desc', 'body', 'content', 'emptyTitle', 'emptyMessage', 'headline', 'tagline', 'question', 'answer', 'note', 'badge', 'cta', 'name2', 'detail', 'details', 'summary', 'tooltip', 'buttonLabel', 'actionLabel', 'cardTitle', 'cardBody']);
const TEXT_CALLS = /^(showAlert|setAlertTitle|setAlertMessage|setAlertText|setError|setLoadError|setFeedback|setMessage|setNotice|setStatusText|setToast|setErrorMessage|setSuccessMessage|setInfo|setFormError|showToast|toast|alert)$|^set[A-Za-z]*(Error|Message|Title|Notice|Feedback)$/;
const LOGIC_CALLS = new Set(['navigate', 'push', 'replace', 'require', 'includes', 'indexOf', 'startsWith', 'endsWith', 'get', 'set', 'has', 'getItem', 'setItem', 'removeItem', 'addEventListener', 'emit', 'on', 'off', 'match', 'test', 'split', 'join', 'log', 'warn', 'error', 'getParent', 'addListener', 'canOpenURL', 'openURL', 'multiGet', 'Error', 'append', 'toLocaleDateString', 'toLocaleTimeString', 'toLocaleString', 'padStart', 'padEnd', 'getAttribute', 'hasOwnProperty', 'find', 'findIndex', 'some', 'every', 'filter']);

function looksLikeText(v, strict) {
  if (!/[A-Za-z]{3,}/.test(v)) return false;
  if (/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+)+$/.test(v)) return false;
  if (/^(https?:|\/|#|\.|@|[a-z]+:\/\/)/.test(v)) return false;
  if (/^[A-Za-z0-9_.-]+\.(png|jpg|jpeg|gif|webp|svg|pdf|json)$/i.test(v)) return false;
  if (/^[a-z][a-zA-Z0-9_]*$/.test(v)) return false; // camelCase or lower id
  if (/^[A-Z0-9_]+$/.test(v) && !/\s/.test(v)) return false; // ENUM
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(v)) return false; // slug
  if (strict && !/\s/.test(v) && !/^[A-Z][a-z]{2,}$/.test(v)) return false;
  return true;
}

function candidatesOf(file) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: true });
  const out = [];
  const lineOf = n => n.loc.start.line;

  function topFn(chain) {
    // nearest enclosing function that is declared at module level
    let fn = null;
    let name = null;
    for (let i = 0; i < chain.length; i++) {
      const n = chain[i];
      if (n.type === 'FunctionDeclaration' || n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression') {
        if (!fn) fn = n;
        // top-level means its container chain has no other function before Program/Export/VariableDeclaration
        const rest = chain.slice(0, i).some(x => /Function/.test(x.type) || x.type === 'ClassMethod' || x.type === 'ClassDeclaration');
        if (!rest) {
          fn = n;
          const p = chain[i - 1];
          if (n.type === 'FunctionDeclaration') name = n.id && n.id.name;
          else if (p && p.type === 'VariableDeclarator' && p.id) name = p.id.name;
          else if (p && p.type === 'CallExpression') name = '(wrapped)';
          break;
        }
      }
      if (n.type === 'ClassMethod' || n.type === 'ClassDeclaration') return { name: 'CLASS', node: n };
    }
    return fn ? { name, node: fn } : null;
  }

  function walk(node, chain) {
    if (!node || typeof node.type !== 'string') return;
    const parent = chain[0];
    const next = [node, ...chain];

    if (node.type === 'StringLiteral' || (node.type === 'TemplateLiteral' && node.expressions.length === 0)) {
      const v = node.type === 'StringLiteral' ? node.value : node.quasis[0].value.cooked;
      classify(node, v, chain);
    } else if (node.type === 'TemplateLiteral' && node.expressions.length > 0) {
      const raw = node.quasis.map(q => q.value.cooked).join('{}');
      if (/[A-Za-z]{3,}[^`]*[A-Za-z]{2,}/.test(raw) && textual(node, chain)) {
        out.push({ line: lineOf(node), start: node.start, end: node.end, kind: 'piece-template', text: code.slice(node.start, node.end), scope: topFn(chain) });
      }
    } else if (node.type === 'JSXText') {
      const v = node.value.replace(/\s+/g, ' ').trim();
      if (/[A-Za-z]{2,}/.test(v) && !/^[&|?:()\[\]{}.,;+\-*/=<>0-9\s]*$/.test(v)) {
        const el = parent;
        const kids = (el.children || []).filter(c => !(c.type === 'JSXText' && !c.value.trim()));
        const mixed = kids.length > 1;
        out.push({
          line: lineOf(node), start: node.start, end: node.end, kind: mixed ? 'piece-jsx' : 'jsxtext', text: v, scope: topFn(chain), scopeInfo: (function () { const tf = topFn(chain); return tf && tf.node && tf.node.body ? { name: tf.name, bodyStart: tf.node.body.start + 1, isBlock: tf.node.body.type === 'BlockStatement' } : null; })(),
          el: code.slice(el.start, Math.min(el.end, el.start + 160)),
        });
      }
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key === 'leadingComments' || key === 'trailingComments') continue;
      const c = node[key];
      if (Array.isArray(c)) c.forEach(x => x && walk(x, next));
      else if (c && typeof c.type === 'string') walk(c, next);
    }
  }

  function textual(node, chain) {
    const p = chain[0];
    if (!p) return false;
    if (p.type === 'JSXExpressionContainer') return true;
    if (p.type === 'JSXAttribute') return TEXT_ATTRS.has(p.name.name);
    if (p.type === 'ObjectProperty' && p.value === node) {
      const k = p.key.name || p.key.value;
      return TEXT_KEYS.has(k);
    }
    if (p.type === 'CallExpression') {
      const name = p.callee.name || (p.callee.property && p.callee.property.name);
      return TEXT_CALLS.test(name || '') || name === 'alert';
    }
    if (p.type === 'LogicalExpression' || p.type === 'ConditionalExpression') return textual(p, chain.slice(1));
    if (p.type === 'AssignmentPattern') return true;
    if (p.type === 'ArrowFunctionExpression') return false;
    if (p.type === 'ReturnStatement') return false;
    return false;
  }

  function classify(node, v, chain) {
    const p = chain[0];
    if (!p) return;
    const entry = (kind, extra = {}) => {
      const tf = topFn(chain);
      const info = tf && tf.node && tf.node.body ? { name: tf.name, bodyStart: tf.node.body.start + 1, isBlock: tf.node.body.type === 'BlockStatement' } : null;
      const more = {};
      if (kind === 'prop' && p.type === 'ObjectProperty' && !p.shorthand && !p.computed) {
        more.propStart = p.start; more.propEnd = p.end;
        more.propKey = code.slice(p.key.start, p.key.end);
      }
      out.push({ line: lineOf(node), start: node.start, end: node.end, kind, text: v, scope: tf, scopeInfo: info, ...more, ...extra });
    };
    // never user text
    if (p.type === 'ImportDeclaration' || p.type === 'ExportNamedDeclaration' || p.type === 'ExportAllDeclaration') return;
    if (p.type === 'TSLiteralType' || p.type === 'TSEnumMember') return;
    if (p.type === 'SwitchCase') return;
    if (p.type === 'BinaryExpression' && /^[!=]=/.test(p.operator)) { if (looksLikeText(v, false)) entry('logic-compare'); return; }
    if (p.type === 'ObjectProperty' && p.key === node && !p.computed) return;
    if (p.type === 'MemberExpression' && p.property === node) { if (looksLikeText(v, false)) entry('logic-member'); return; }
    if (p.type === 'CallExpression' || p.type === 'NewExpression') {
      const name = p.callee.name || (p.callee.property && p.callee.property.name) || '';
      if (LOGIC_CALLS.has(name) && !TEXT_CALLS.test(name)) { if (looksLikeText(v, false) && /\s|^[A-Z]/.test(v)) entry('logic-call:' + name); return; }
    }
    if (p.type === 'JSXAttribute') {
      const name = p.name.name;
      if (!TEXT_ATTRS.has(name)) return;
      if (looksLikeText(v, false)) entry('attr', { name });
      return;
    }
    if (p.type === 'ObjectProperty' && p.value === node) {
      const k = p.key.name || p.key.value;
      if (TEXT_KEYS.has(k) && looksLikeText(v, false)) entry('prop', { name: k });
      else if (!TEXT_KEYS.has(k) && looksLikeText(v, true) && /\s/.test(v)) entry('prop-other', { name: k });
      return;
    }
    if (p.type === 'CallExpression') {
      const name = p.callee.name || (p.callee.property && p.callee.property.name) || '';
      if (TEXT_CALLS.test(name) || (name === 'alert')) { if (looksLikeText(v, false)) entry('arg', { name }); return; }
    }
    if (p.type === 'AssignmentPattern' && p.right === node) { if (looksLikeText(v, false)) entry('default'); return; }
    if (p.type === 'JSXExpressionContainer') { if (looksLikeText(v, false)) entry('expr'); return; }
    if (p.type === 'ConditionalExpression' && (p.consequent === node || p.alternate === node)) {
      if (looksLikeText(v, false)) entry('ternary', { ctx: textual(p, chain.slice(1)) ? 'text' : 'other' });
      return;
    }
    if (p.type === 'LogicalExpression' && p.right === node) {
      if (looksLikeText(v, true) && /\s/.test(v)) entry('fallback', { ctx: textual(p, chain.slice(1)) ? 'text' : 'other' });
      else if (looksLikeText(v, false)) entry('fallback-short', { ctx: textual(p, chain.slice(1)) ? 'text' : 'other' });
      return;
    }
    if (p.type === 'ArrayExpression') { if (looksLikeText(v, true)) entry('list'); return; }
    if (p.type === 'VariableDeclarator') { if (looksLikeText(v, true) && /\s/.test(v)) entry('const'); return; }
    if (p.type === 'ReturnStatement' || p.type === 'ArrowFunctionExpression') { if (looksLikeText(v, true)) entry('return'); return; }
    if (p.type === 'AssignmentExpression') { if (looksLikeText(v, true)) entry('assign'); return; }
    if (looksLikeText(v, true) && /\s/.test(v)) entry('other:' + p.type);
  }

  walk(ast.program, []);
  return out;
}

if (require.main === module) {
  const [outFile, ...files] = process.argv.slice(2);
  const result = {};
  for (const f of files) {
    try {
      result[f] = candidatesOf(f).map(c => ({ ...c, scope: c.scope ? c.scope.name : null }));
    } catch (e) {
      result[f] = [{ kind: 'ERROR', text: String(e.message) }];
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
  const kinds = {};
  Object.values(result).flat().forEach(c => (kinds[c.kind] = (kinds[c.kind] || 0) + 1));
  console.log(kinds);
}
module.exports = { candidatesOf, looksLikeText };

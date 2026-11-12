/* Moonboat's browser theme-color must match the active theme background. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const gameDir = path.join(root, 'v3-moonboat');
const htmlPath = path.join(gameDir, 'index.html');
const cssPath = path.join(gameDir, 'style.css');
const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const names = ['Dark', 'Cloud day', 'Plum dusk'];
const expected = ['#0e1238', '#e3e9ff', '#2a1638'];

function backgrounds() {
  const base = {};
  const overrides = new Map();
  const rule = /body\.space(?:\[data-theme="(\d+)"\])?\{([^}]+)\}/g;
  for (const match of css.matchAll(rule)) {
    const tokens = {};
    for (const token of match[2].matchAll(/(--bg):\s*(#[0-9a-fA-F]{6})/g)) tokens[token[1]] = token[2].toLowerCase();
    if (match[1] == null) Object.assign(base, tokens);
    else overrides.set(Number(match[1]), tokens);
  }
  return names.map((_, index) => overrides.get(index)?.['--bg'] || base['--bg']);
}

function hexColor(value) {
  const color = String(value || '').trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(color)) return color;
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([0-9.]+))?\s*\)$/.exec(color);
  if (!rgb || (rgb[4] !== undefined && Number(rgb[4]) === 0)) return '';
  return '#' + [rgb[1], rgb[2], rgb[3]].map(part => Number(part).toString(16).padStart(2, '0')).join('');
}

function rgb(hex) {
  const channels = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${channels.join(', ')})`;
}

const colors = backgrounds();
assert.deepEqual(colors, expected, 'Moonboat theme backgrounds changed');

const themeLine = html.split('\n').findIndex(line => line.includes('name="theme-color"')) + 1;
const declared = html.match(/<meta name="theme-color" content="([^"]*)">/);
const failures = [];
function expect(actual, wanted, message) {
  if (actual !== wanted) failures.push(`${message}: ${actual} !== ${wanted}`);
}

expect(hexColor(declared?.[1]), colors[0], `v3-moonboat/index.html:${themeLine} theme-color`);

function makeNode() {
  return {
    innerHTML: '', textContent: '', value: '', dataset: {}, listeners: {}, attributes: {},
    classList: {add() {}, remove() {}},
    addEventListener(name, handler) { this.listeners[name] = handler; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    focus() {}
  };
}

async function boot(saved) {
  const nodes = new Map();
  const meta = makeNode();
  meta.setAttribute('content', declared[1]);
  const getNode = selector => {
    if (selector === 'meta[name="theme-color"]') return meta;
    if (!nodes.has(selector)) nodes.set(selector, makeNode());
    return nodes.get(selector);
  };
  const body = makeNode();
  const document = {
    body, hidden: false, querySelector: getNode, querySelectorAll() { return []; },
    addEventListener() {}
  };
  const store = new Map();
  if (saved != null) store.set('little-woof-space-theme', String(saved));
  const window = {
    Fun: {cancel() {}, voice() {}, mute() {}, home() {}, exit() { return Promise.resolve(); }, weather() {}},
    scrollTo() {}
  };
  const context = vm.createContext({
    window, document,
    getComputedStyle(element) {
      const index = Number(element?.dataset?.theme || 0);
      return {backgroundColor: rgb(colors[index] || colors[0])};
    },
    setTimeout, clearTimeout, queueMicrotask,
    location: {protocol: 'file:'},
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); }
    }
  });
  vm.runInContext(fs.readFileSync(path.join(gameDir, 'config.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'v1-letter-post/art.js'), 'utf8'), context);
  context.draw = window.draw;
  context.ico = window.ico;
  vm.runInContext(fs.readFileSync(path.join(root, 'audio-map.js'), 'utf8'), context);
  await vm.runInContext(fs.readFileSync(path.join(gameDir, 'app.js'), 'utf8'), context);
  return {meta, theme: getNode('#theme'), body};
}

function chrome(meta) {
  return hexColor(meta.getAttribute('content'));
}

(async () => {
  const loaded = await boot(null);
  expect(chrome(loaded.meta), colors[0], 'theme-color after first load');
  expect(loaded.body.dataset.theme, '0', 'Dark theme still applied on load');
  for (const index of [1, 2, 0]) {
    loaded.theme.value = String(index);
    loaded.theme.listeners.change({target: loaded.theme});
    expect(chrome(loaded.meta), colors[index], `theme-color after changing to ${names[index]}`);
    expect(loaded.body.dataset.theme, String(index), `${names[index]} still applied`);
  }
  const saved = await boot(2);
  expect(chrome(saved.meta), colors[2], 'theme-color after loading saved Plum dusk');
  expect(saved.body.dataset.theme, '2', 'saved Plum dusk still applied');
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`PASS moonboat theme-color follows ${colors.join(', ')} on load and on each theme change`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

import esbuild from 'esbuild';
import process from 'node:process';

const production = process.argv[2] === 'production';

const nodeBuiltins = [
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns',
  'domain', 'events', 'fs', 'http', 'https', 'net', 'os', 'path', 'punycode',
  'querystring', 'readline', 'stream', 'string_decoder', 'tls', 'tty',
  'url', 'util', 'v8', 'vm', 'zlib',
];

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'cjs',
  target: 'es2022',
  platform: 'browser',
  sourcemap: production ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...nodeBuiltins,
  ],
  footer: {
    js: 'module.exports = module.exports.default || module.exports;',
  },
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}


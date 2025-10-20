import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';

import fs from 'fs';


const prod = process.argv[2] === 'production';


await esbuild.build({
  entryPoints: ['./src/styles.css'],
  bundle: false,
  outfile: 'dist/styles.css',
  loader: { '.css': 'copy' },
});

await esbuild.build({
  entryPoints: ['./manifest.json'],
  bundle: false,
  outfile: 'dist/manifest.json',
  loader: { '.json': 'copy' },
});

esbuild
  .build({
    entryPoints: [
      './src/main.ts'
    ],
    bundle: true,
    outfile: 'dist/main.js',

    external: [
      'obsidian',
      'electron',
      '@codemirror/autocomplete',
      '@codemirror/closebrackets',
      '@codemirror/collab',
      '@codemirror/commands',
      '@codemirror/comment',
      '@codemirror/fold',
      '@codemirror/gutter',
      '@codemirror/highlight',
      '@codemirror/history',
      '@codemirror/language',
      '@codemirror/lint',
      '@codemirror/matchbrackets',
      '@codemirror/panel',
      '@codemirror/rangeset',
      '@codemirror/rectangular-selection',
      '@codemirror/search',
      '@codemirror/state',
      '@codemirror/stream-parser',
      '@codemirror/text',
      '@codemirror/tooltip',
      '@codemirror/view',
      'node:*',
      ...builtins,
    ],
    format: 'cjs',
    target: 'es2016',
    logLevel: 'info',
    sourcemap: prod ? false : 'inline',
    treeShaking: true,
    minify: prod,
  })
  .catch(() => process.exit(1));

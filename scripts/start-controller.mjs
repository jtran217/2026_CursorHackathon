#!/usr/bin/env node
/**
 * Cross-platform controller launcher.
 * macOS/Linux: python3; Windows: python.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const controllerDir = path.join(root, 'controller');

const isWin = process.platform === 'win32';
const python = isWin ? 'python' : 'python3';

const proc = spawn(python, ['app.py'], {
  cwd: controllerDir,
  stdio: 'inherit',
  shell: false,
});

proc.on('error', (err) => {
  console.error('Failed to start controller:', err.message);
  if (!isWin && err.code === 'ENOENT') {
    console.error('Tip: On macOS, ensure python3 is installed (brew install python3).');
  }
  process.exit(1);
});

proc.on('exit', (code) => {
  process.exit(code ?? 0);
});

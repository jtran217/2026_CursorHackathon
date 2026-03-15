#!/usr/bin/env node
/**
 * Cross-platform backend launcher.
 * Uses backend/.venv if it exists, otherwise falls back to system python.
 * macOS: prefers python3; Windows: uses python.
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');

const isWin = process.platform === 'win32';
const binDir = isWin ? 'Scripts' : 'bin';
const pyExe = isWin ? 'python.exe' : 'python';

// Check root .venv first (where pip install typically lands), then backend/.venv
const venvCandidates = [
  path.join(root, '.venv', binDir, pyExe),
  path.join(backendDir, '.venv', binDir, pyExe),
];

const python = venvCandidates.find(fs.existsSync) ?? (isWin ? 'python' : 'python3');

const proc = spawn(python, ['-m', 'flask', '--app', 'app', 'run', '--debug', '--port', '5001'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});

proc.on('error', (err) => {
  console.error('Failed to start backend:', err.message);
  process.exit(1);
});

proc.on('exit', (code) => {
  process.exit(code ?? 0);
});

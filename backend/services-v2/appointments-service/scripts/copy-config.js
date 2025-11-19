/**
 * Copies JSON config files to the dist folder after TypeScript build.
 * Ensures runtime artifacts (e.g. reminder-policy.json) exist in Docker image.
 */
const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '../src/config');
const targetDir = path.resolve(__dirname, '../dist/appointments-service/src/config');

if (!fs.existsSync(sourceDir)) {
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

const copied = [];

for (const file of fs.readdirSync(sourceDir)) {
  if (!file.endsWith('.json')) {
    continue;
  }

  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  fs.copyFileSync(sourcePath, targetPath);
  copied.push(file);
}

if (copied.length > 0) {
  console.log(`[copy-config] Copied JSON configs: ${copied.join(', ')}`);
} else {
  console.log('[copy-config] No JSON config files detected.');
}

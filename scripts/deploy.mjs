/**
 * deploy.mjs — Copies the built plugin (main.js, manifest.json, styles.css)
 * into Obsidian vault plugin folders so Obsidian actually loads the fresh
 * build instead of a stale one.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(pkgRoot, 'manifest.json'), 'utf8'));
const pluginId = manifest.id;
const FILES = ['main.js', 'manifest.json', 'styles.css'];

/** Reads the vault lists used by native and Flatpak Obsidian installations. */
function detectVaults() {
  const home = process.env.HOME ?? '';
  const configPaths = [
    process.env.APPDATA ? join(process.env.APPDATA, 'obsidian', 'obsidian.json') : null,
    join(home, '.config', 'obsidian', 'obsidian.json'),
    join(home, '.var', 'app', 'md.obsidian.Obsidian', 'config', 'obsidian', 'obsidian.json'),
  ].filter(Boolean);
  const vaults = new Set();

  for (const configPath of configPaths) {
    if (!existsSync(configPath)) continue;
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      Object.values(config.vaults ?? {})
        .map((vault) => vault.path)
        .filter((path) => typeof path === 'string' && existsSync(path))
        .forEach((path) => vaults.add(path));
    } catch (err) {
      console.warn(`[deploy] Could not parse ${configPath}:`, err.message);
    }
  }

  return [...vaults];
}

function deployToDir(target) {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }
  for (const file of FILES) {
    const src = join(pkgRoot, file);
    if (!existsSync(src)) {
      console.error(`[deploy] Missing ${file} — run the build first: npm run build`);
      process.exit(1);
    }
    copyFileSync(src, join(target, file));
  }
  console.log(`[deploy] ✓ Deployed to ${target}`);
}

function deployTo(vaultPath) {
  const targetNew = join(vaultPath, '.obsidian', 'plugins', pluginId);
  deployToDir(targetNew);

  // Also deploy to legacy folder if present so existing vault configs reload instantly
  const targetLegacy = join(vaultPath, '.obsidian', 'plugins', 'obsidian-rich-editor');
  if (existsSync(targetLegacy)) {
    deployToDir(targetLegacy);
  }
  return true;
}

// ── Resolve targets ──────────────────────────────────────────────────────────

const explicitVault = process.argv[2] ?? process.env.OBSIDIAN_VAULT;
let deployed = 0;

if (explicitVault) {
  const vaultPath = resolve(explicitVault);
  if (!existsSync(vaultPath)) {
    console.error(`[deploy] Vault path does not exist: ${vaultPath}`);
    process.exit(1);
  }
  if (deployTo(vaultPath)) deployed++;
} else {
  const vaults = detectVaults();
  if (vaults.length === 0) {
    console.error(
      '[deploy] No vault found. Pass the vault path explicitly:\n' +
        '         npm run deploy -- "C:\\path\\to\\your\\vault"\n' +
        '       (or set the OBSIDIAN_VAULT environment variable)'
    );
    process.exit(1);
  }
  for (const vault of vaults) {
    if (deployTo(vault)) deployed++;
  }
}

console.log(
  `[deploy] Done (${deployed} vault(s)). Now reload Obsidian (Ctrl+R) ` +
    'or disable/enable the plugin so the new build is loaded.'
);

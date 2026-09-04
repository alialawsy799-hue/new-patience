import fs from 'node:fs';
import path from 'node:path';

/**
 * Minimal .env loader.
 *
 * Next.js loads `.env*` files on its own, but the standalone scripts
 * (migrate / seed / code generation / export) run through `tsx` and need the
 * same values. Existing `process.env` entries always win so real deployment
 * secrets are never overwritten by a stray file.
 */
function parse(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  const root = process.cwd();
  // Later files must not override earlier ones, matching Next.js precedence.
  const candidates = ['.env.local', '.env'];

  for (const file of candidates) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const values = parse(fs.readFileSync(full, 'utf8'));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnv();

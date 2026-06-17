// Auth & configuration resolution for the CLI.
//
// Effective auth precedence: --flag > env var > saved credentials file.
//   key      : --api-key  / APPLYTOP_API_KEY  / ~/.applytop/credentials.json
//   base URL : --api-url   / APPLYTOP_API_URL  / saved file / DEFAULT_BASE_URL
//   insecure : --insecure  / APPLYTOP_INSECURE (dev self-signed certs only)

import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, rmSync, chmodSync } from 'node:fs';
import { DEFAULT_BASE_URL } from './client.js';

const CONFIG_DIR = join(homedir(), '.applytop');
const CREDS_PATH = join(CONFIG_DIR, 'credentials.json');

export function credsPath() {
  return CREDS_PATH;
}

export function readCreds() {
  try {
    return JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
  } catch (_) {
    return null;
  }
}

export function writeCreds({ apiKey, baseUrl }) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  try { chmodSync(CONFIG_DIR, 0o700); } catch (_) { /* best effort */ }
  writeFileSync(CREDS_PATH, JSON.stringify({ apiKey, baseUrl: baseUrl || DEFAULT_BASE_URL }, null, 2) + '\n');
  try { chmodSync(CREDS_PATH, 0o600); } catch (_) { /* best effort */ }
  return CREDS_PATH;
}

export function clearCreds() {
  try { rmSync(CREDS_PATH); return true; } catch (_) { return false; }
}

// Resolve the effective auth from flags/env/file. Returns
// { apiKey, baseUrl, insecure, source } where source ∈ flag|env|file|none.
export function resolveAuth({ apiKey, apiUrl, insecure } = {}) {
  const file = readCreds() || {};
  const source = apiKey ? 'flag' : (process.env.APPLYTOP_API_KEY ? 'env' : (file.apiKey ? 'file' : 'none'));
  const resolvedKey = apiKey || process.env.APPLYTOP_API_KEY || file.apiKey || null;
  const baseUrl = apiUrl || process.env.APPLYTOP_API_URL || file.baseUrl || DEFAULT_BASE_URL;
  const insec = !!insecure || process.env.APPLYTOP_INSECURE === '1' || process.env.APPLYTOP_INSECURE === 'true';
  return { apiKey: resolvedKey, baseUrl, insecure: insec, source };
}

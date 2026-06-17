#!/usr/bin/env node
// applytop — CLI for the ApplyTop public API. Thin wrapper over the ApplyTop
// client (src/client.js); every command resolves auth (flag > env > saved file),
// calls the client, and prints JSON to stdout.

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ApplyTop } from '../src/client.js';
import { resolveAuth } from '../src/config.js';
import { printError } from '../src/output.js';
import registerAuth from '../src/commands/auth.js';
import registerAccount from '../src/commands/account.js';
import registerJobs from '../src/commands/jobs.js';
import registerAlerts from '../src/commands/alerts.js';
import registerMatches from '../src/commands/matches.js';
import registerSaved from '../src/commands/saved.js';
import registerCvs from '../src/commands/cvs.js';

// Allow self-signed TLS (dev) as early as possible — before any fetch opens a
// socket. Honors both the --insecure flag and APPLYTOP_INSECURE.
if (process.argv.includes('--insecure') || process.env.APPLYTOP_INSECURE === '1' || process.env.APPLYTOP_INSECURE === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();
program
  .name('applytop')
  .description('CLI for the ApplyTop public API — jobs, alerts, matches, saved jobs, and CVs.')
  .version(pkg.version)
  .option('--api-key <key>', 'API key (overrides env and saved credentials)')
  .option('--api-url <url>', 'API base URL (default: https://applytop.com/api/v1)')
  .option('--insecure', 'allow self-signed TLS certs (dev only)')
  .option('--raw', 'compact single-line JSON output');

// Build an ApplyTop client from the resolved auth for the running command.
function makeClient(command) {
  const opts = command.optsWithGlobals();
  const { apiKey, baseUrl, insecure } = resolveAuth({ apiKey: opts.apiKey, apiUrl: opts.apiUrl, insecure: opts.insecure });
  if (insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  return new ApplyTop({ apiKey, baseUrl, insecure });
}

const ctx = { makeClient };
for (const register of [registerAuth, registerAccount, registerJobs, registerAlerts, registerMatches, registerSaved, registerCvs]) {
  register(program, ctx);
}

// Bare invocation → help.
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
  process.exit(0);
}

program.parseAsync(process.argv).catch((err) => {
  printError(err, { raw: program.opts().raw });
  process.exit(1);
});

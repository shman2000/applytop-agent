// auth:* — manage the stored API key (paste/validate/store, status, logout).
import { createInterface } from 'node:readline/promises';
import { ApplyTop } from '../client.js';
import { resolveAuth, writeCreds, clearCreds, credsPath } from '../config.js';
import { emit } from '../output.js';

export default function registerAuth(program, { makeClient }) {
  program
    .command('auth:login')
    .description('Save an API key (validates it against the API)')
    .option('--api-key <key>', 'API key to store (omit to be prompted)')
    .option('--api-url <url>', 'API base URL to store')
    .action(async (opts, command) => {
      const globals = command.optsWithGlobals();
      let key = opts.apiKey || globals.apiKey || process.env.APPLYTOP_API_KEY;
      if (!key) {
        const rl = createInterface({ input: process.stdin, output: process.stderr });
        key = (await rl.question('Paste your ApplyTop API key: ')).trim();
        rl.close();
      }
      if (!key) throw new Error('No API key provided.');
      if (globals.insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      const baseUrl = opts.apiUrl || globals.apiUrl || process.env.APPLYTOP_API_URL || undefined;
      const client = new ApplyTop({ apiKey: key, baseUrl, insecure: globals.insecure });
      const me = await client.me(); // throws ApplyTopError if the key is invalid
      const path = writeCreds({ apiKey: key, baseUrl: client.baseUrl });
      process.stderr.write(`Logged in as ${me.user?.email || 'unknown'} (${me.user?.subscription_tier || 'free'}). Saved to ${path}\n`);
      emit(command, { user: me.user });
    });

  program
    .command('auth:status')
    .description('Show the current authentication status')
    .action(async (opts, command) => {
      const globals = command.optsWithGlobals();
      const { apiKey, baseUrl, source } = resolveAuth({ apiKey: globals.apiKey, apiUrl: globals.apiUrl, insecure: globals.insecure });
      if (!apiKey) {
        emit(command, { authenticated: false, message: 'No API key. Run "applytop auth:login" or set APPLYTOP_API_KEY.' });
        return;
      }
      const me = await makeClient(command).me();
      emit(command, { authenticated: true, source, baseUrl, user: me.user });
    });

  program
    .command('auth:logout')
    .description('Remove the saved credentials file')
    .action(async (opts, command) => {
      const removed = clearCreds();
      emit(command, { ok: true, removed, path: credsPath() });
    });
}

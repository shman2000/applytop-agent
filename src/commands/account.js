// account:* — the key owner's profile and AI-credit balance.
import { emit } from '../output.js';

export default function registerAccount(program, { makeClient }) {
  program
    .command('account:me')
    .description("Show the API key owner's profile")
    .action(async (opts, command) => { emit(command, await makeClient(command).me()); });

  program
    .command('account:credits')
    .description('Show your AI-credit balance and subscription tier')
    .action(async (opts, command) => { emit(command, await makeClient(command).credits()); });
}

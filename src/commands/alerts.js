// alerts:* — your job alerts and their matched jobs.
import { emit } from '../output.js';
import { toInt } from './util.js';

export default function registerAlerts(program, { makeClient }) {
  program
    .command('alerts:list')
    .description('List your job alerts')
    .option('--limit <n>', 'max results', toInt)
    .option('--offset <n>', 'offset', toInt)
    .option('--status <status>', 'status filter (active|paused|archived)')
    .option('--search <q>', 'search alerts')
    .action(async (opts, command) => {
      emit(command, await makeClient(command).alertsList({
        limit: opts.limit, offset: opts.offset, status: opts.status, search: opts.search,
      }));
    });

  program
    .command('alerts:jobs')
    .description('List matched jobs for one of your alerts')
    .argument('<alertId>', 'alert id')
    .option('--limit <n>', 'max results', toInt)
    .option('--min-score <n>', 'minimum match % (0-100)', toInt)
    .option('--search <q>', 'search')
    .action(async (alertId, opts, command) => {
      emit(command, await makeClient(command).alertsJobs({
        alert_id: alertId, limit: opts.limit, minScore: opts.minScore, search: opts.search,
      }));
    });
}

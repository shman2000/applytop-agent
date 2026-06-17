// saved:* — your saved jobs.
import { emit } from '../output.js';
import { toInt } from './util.js';

export default function registerSaved(program, { makeClient }) {
  program
    .command('saved:list')
    .description('List your saved jobs')
    .option('--limit <n>', 'max results', toInt)
    .option('--offset <n>', 'offset', toInt)
    .option('--country <country>', 'country filter')
    .option('--work-model <model>', 'remote | hybrid | on-site')
    .option('--search <q>', 'search')
    .action(async (opts, command) => {
      emit(command, await makeClient(command).savedList({
        limit: opts.limit, offset: opts.offset, country: opts.country, work_model: opts.workModel, search: opts.search,
      }));
    });
}

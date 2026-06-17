// jobs:* — search the public jobs pool.
import { emit } from '../output.js';
import { toInt } from './util.js';

export default function registerJobs(program, { makeClient }) {
  program
    .command('jobs:search')
    .description('Search the public jobs pool')
    .option('-q, --query <q>', 'keyword query (title)')
    .option('--country <country>', 'country filter')
    .option('--work-model <model>', 'remote | hybrid | on-site')
    .option('--type <type>', 'job type filter')
    .option('--limit <n>', 'results per page (max 60)', toInt)
    .option('--page <n>', 'page number', toInt)
    .action(async (opts, command) => {
      const data = await makeClient(command).jobsSearch({
        q: opts.query, country: opts.country, work_model: opts.workModel,
        type: opts.type, limit: opts.limit, page: opts.page,
      });
      emit(command, data);
    });

  program
    .command('jobs:get')
    .description('Fetch one pool job by id or slug')
    .option('--id <id>', 'job id')
    .option('--slug <slug>', 'job slug')
    .action(async (opts, command) => {
      if (!opts.id && !opts.slug) throw new Error('Provide --id or --slug.');
      emit(command, await makeClient(command).jobsGet({ id: opts.id, slug: opts.slug }));
    });
}

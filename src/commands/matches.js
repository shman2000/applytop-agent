// matches:* — your matched jobs across all alerts.
import { emit } from '../output.js';
import { toInt } from './util.js';

export default function registerMatches(program, { makeClient }) {
  program
    .command('matches:list')
    .description('List your matched jobs across all alerts (sorted by match score)')
    .option('--min-score <n>', 'minimum match % (0-100)', toInt)
    .option('--country <country>', 'country filter')
    .option('--work-model <model>', 'remote | hybrid | on-site')
    .option('--search <q>', 'search')
    .option('--sort-by <field>', 'match_score | hybrid | date_posted')
    .option('--limit <n>', 'max results', toInt)
    .option('--offset <n>', 'offset', toInt)
    .action(async (opts, command) => {
      emit(command, await makeClient(command).matchesList({
        minScore: opts.minScore, country: opts.country, work_model: opts.workModel,
        search: opts.search, sortBy: opts.sortBy, limit: opts.limit, offset: opts.offset,
      }));
    });

  program
    .command('matches:get')
    .description('Get one matched job in full detail')
    .argument('<matchId>', 'match id (from matches:list)')
    .action(async (matchId, opts, command) => {
      emit(command, await makeClient(command).matchesGet(matchId));
    });
}

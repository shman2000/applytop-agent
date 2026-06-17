// cvs:* — list/get your CVs, download as PDF, and run the AI tools.
import { writeFileSync } from 'node:fs';
import { emit } from '../output.js';

export default function registerCvs(program, { makeClient }) {
  program
    .command('cvs:list')
    .description('List your CVs (metadata)')
    .action(async (opts, command) => { emit(command, await makeClient(command).cvsList()); });

  program
    .command('cvs:get')
    .description('Get one of your CVs in full detail')
    .argument('<cvId>', 'CV id')
    .action(async (cvId, opts, command) => { emit(command, await makeClient(command).cvsGet(cvId)); });

  program
    .command('cvs:pdf')
    .description('Download one of your CVs as a PDF')
    .argument('<cvId>', 'CV id')
    .option('--template <name>', 'modern | classic | compact | executive | creative | minimal')
    .option('-o, --output <file>', 'output file path (default: <cvId>.pdf)')
    .action(async (cvId, opts, command) => {
      const buf = await makeClient(command).cvsDownloadPdf(cvId, { template: opts.template });
      const file = opts.output || `${cvId}.pdf`;
      writeFileSync(file, buf);
      emit(command, { ok: true, file, bytes: buf.length });
    });

  program
    .command('cvs:ats-score')
    .description('ATS score for one of your CVs (costs 1 credit)')
    .argument('<cvId>', 'CV id')
    .action(async (cvId, opts, command) => { emit(command, await makeClient(command).cvsAtsScore(cvId)); });

  program
    .command('cvs:tailor')
    .description('Generate a CV tailored to a job (costs 1 credit)')
    .argument('<jobId>', 'pool job id (jobs:search) or match id (matches:list)')
    .option('--cv <cvId>', 'CV to tailor (defaults to your default CV)')
    .option('--template <name>', 'template name')
    .action(async (jobId, opts, command) => {
      emit(command, await makeClient(command).cvsTailorToJob({ jobId, cvId: opts.cv, template: opts.template }));
    });

  program
    .command('cvs:cover-letter')
    .description('Generate a cover letter for a job (costs 1 credit)')
    .argument('<jobId>', 'pool job id or match id')
    .option('--cv <cvId>', 'CV to base it on (defaults to your default CV)')
    .option('--hiring-manager <name>', 'hiring manager name')
    .action(async (jobId, opts, command) => {
      emit(command, await makeClient(command).cvsCoverLetterForJob({ jobId, cvId: opts.cv, hiringManager: opts.hiringManager }));
    });
}

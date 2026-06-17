// Programmatic entry point (package "main"/"exports"):
//   import { ApplyTop } from 'applytop';
//   const client = new ApplyTop({ apiKey: 'at_live_...' });
//   const { jobs } = await client.jobsSearch({ q: 'engineer', limit: 5 });
export { ApplyTop, ApplyTopError, DEFAULT_BASE_URL } from './client.js';
export { default } from './client.js';

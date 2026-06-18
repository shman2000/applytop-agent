# applytop

Command-line interface **and** Node client for the [ApplyTop](https://applytop.com) public API. Search jobs and access your alerts, matches, saved jobs, and CVs — including AI-powered ATS scoring, CV tailoring, and cover-letter generation — straight from your terminal or your own code.

Plain JavaScript (ESM), Node ≥ 18, zero config to get started.

## Install

```bash
npm install -g applytop
```

Or run without installing:

```bash
npx applytop jobs:search -q engineer
```

## Authenticate

You need an API key. Create one at **[applytop.com/dashboard/api-keys](https://applytop.com/dashboard/api-keys)** (keys look like `at_live_…`).

> **Requires an ApplyTop Pro subscription.** The API and CLI are a Pro feature — free accounts can't create keys, and calls from a non-Pro account return `403 pro_required`.

Then either log in once (stored at `~/.applytop/credentials.json`):

```bash
applytop auth:login            # prompts for your key, validates it, saves it
applytop auth:login --api-key at_live_xxx
applytop auth:status           # who am I?
applytop auth:logout
```

…or set an environment variable:

```bash
export APPLYTOP_API_KEY=at_live_xxx
```

…or pass `--api-key` per command. **Precedence: `--api-key` flag > `APPLYTOP_API_KEY` env > saved credentials file.**

## Usage

Commands are namespaced `resource:action` and print JSON to stdout, so they pipe cleanly into `jq`:

```bash
applytop jobs:search -q "react developer" --work-model remote --limit 5 | jq '.jobs[].title'
applytop account:me
applytop account:credits
applytop matches:list --min-score 60 --limit 10
applytop cvs:list
applytop cvs:tailor <jobId> --cv <cvId>        # costs 1 credit
applytop cvs:pdf <cvId> -o resume.pdf
```

Run `applytop --help` or `applytop <command> --help` for full details.

### Command reference

| Command | Description |
|---|---|
| `auth:login` | Save an API key (validates it). `--api-key`, `--api-url` |
| `auth:status` | Show authentication status (key source, owner, tier) |
| `auth:logout` | Remove the saved credentials |
| `account:me` | Your profile |
| `account:credits` | Your AI-credit balance and tier |
| `jobs:search` | Search the public jobs pool. `-q/--query`, `--country`, `--work-model`, `--type`, `--limit`, `--page` |
| `jobs:get` | One pool job. `--id` \| `--slug` |
| `alerts:list` | Your job alerts. `--limit`, `--offset`, `--status`, `--search` |
| `alerts:jobs <alertId>` | Matched jobs for one alert. `--limit`, `--min-score`, `--search` |
| `matches:list` | Your matched jobs across all alerts. `--min-score`, `--country`, `--work-model`, `--search`, `--sort-by`, `--limit`, `--offset` |
| `matches:get <matchId>` | One matched job, full detail |
| `saved:list` | Your saved jobs. `--limit`, `--offset`, `--country`, `--work-model`, `--search` |
| `cvs:list` | Your CVs (metadata) |
| `cvs:get <cvId>` | One CV, full detail |
| `cvs:pdf <cvId>` | Download a CV as PDF. `--template`, `-o/--output` |
| `cvs:ats-score <cvId>` | ATS score for a CV — **1 credit** |
| `cvs:tailor <jobId>` | CV tailored to a job — **1 credit**. `--cv`, `--template` |
| `cvs:cover-letter <jobId>` | Cover letter for a job — **1 credit**. `--cv`, `--hiring-manager` |

`<jobId>` for the tailoring commands accepts a **pool job id** (from `jobs:search`) **or** one of your **matched job ids** (from `matches:list`). If you omit `--cv`, your default CV is used.

### Global options

| Flag | Meaning |
|---|---|
| `--api-key <key>` | API key (overrides env + saved file) |
| `--api-url <url>` | API base URL (default `https://applytop.com/api/v1`) |
| `--insecure` | Allow self-signed TLS certs (dev only) |
| `--raw` | Compact single-line JSON |
| `--version`, `--help` | Version / help |

## Programmatic use (the client)

The same package exports the client class:

```js
import { ApplyTop, ApplyTopError } from 'applytop';

const client = new ApplyTop({ apiKey: process.env.APPLYTOP_API_KEY });

const { jobs, total } = await client.jobsSearch({ q: 'engineer', work_model: 'remote', limit: 5 });
console.log(total, jobs.map((j) => j.title));

try {
  const result = await client.cvsTailorToJob({ jobId, cvId });   // 1 credit
  console.log(result.cvId, 'balance:', result.balance);
} catch (err) {
  if (err instanceof ApplyTopError && err.code === 'insufficient_credits') {
    console.error(`Need ${err.required}, have ${err.balance}`);
  } else {
    throw err;
  }
}
```

Methods (each returns the response `data`): `me()`, `credits()`, `jobsSearch()`, `jobsGet()`, `alertsList()`, `alertsJobs()`, `matchesList()`, `matchesGet()`, `savedList()`, `cvsList()`, `cvsGet()`, `cvsAtsScore()`, `cvsTailorToJob()`, `cvsCoverLetterForJob()`, and `cvsDownloadPdf()` (resolves to a `Buffer`).

## Output & errors

Success prints the response payload as JSON to **stdout** (exit 0). Errors print `{ "error": { "code", "message", … } }` to **stderr** and exit **1**. Common codes:

| Code | Meaning |
|---|---|
| `auth_required` / `invalid_api_key` | Missing / invalid key |
| `insufficient_credits` | Out of AI credits (includes `balance`, `required`, `tier`) |
| `premium_template_requires_pro` | A Pro-only PDF template on a free plan |
| `not_found` | Resource missing or not yours |
| `rate_limited` | Per-key rate limit (100/min) exceeded |

## Credits

`cvs:tailor`, `cvs:cover-letter`, and `cvs:ats-score` each cost **1 AI credit** (charged to the key owner; check with `account:credits`). Everything else is free. A failed AI generation is automatically refunded.

## Documentation

- **[CLI Docs](https://applytop.com/cli-docs)** — full command reference and examples
- **[API Docs](https://applytop.com/api-docs)** — the underlying ApplyTop public API
- **[API Keys Dashboard](https://applytop.com/dashboard/api-keys)** — create and manage keys
- **[applytop on npm](https://www.npmjs.com/package/applytop)** — package page
- **[ApplyTop](https://applytop.com)** — the platform

## License

Copyright ApplyTop.

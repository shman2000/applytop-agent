## Description: <br>
Command-line interface and Node client for the ApplyTop public API. Search the public jobs pool and access your alerts, matches, saved jobs, and CVs — including AI ATS scoring, CV tailoring, and cover-letter generation — from the terminal or programmatically. Commands print JSON to stdout for clean piping into `jq`. Authentication uses a per-account API key (`APPLYTOP_API_KEY`); the API is an ApplyTop Pro feature. <br>

This skill is ready for commercial/non-commercial use. <br>

## Publisher: <br>
[ApplyTop](https://applytop.com) <br>

### License/Terms of Use: <br>
See [LICENSE](LICENSE). API access governed by the ApplyTop Terms of Use at https://applytop.com. <br>

## Use Case: <br>
Developers, job seekers, and automation operators use this skill to search the ApplyTop jobs pool and work with their alerts, matches, saved jobs, and CVs from the terminal or their own code. It supports AI-powered ATS scoring, CV tailoring, and cover-letter generation against a given job, and returns structured JSON suitable for scripting and pipelines. <br>

### Deployment Geography for Use: <br>
Global <br>

## Known Risks and Mitigations: <br>
Risk: Commands authenticate with a per-account ApplyTop API key (`at_live_…`). <br>
Mitigation: Store the key in `APPLYTOP_API_KEY` or `~/.applytop/credentials.json`, never paste it into shared shells or commit it, and rotate keys from https://applytop.com/dashboard/api-keys. <br>
Risk: Three commands cost 1 AI credit each (`cvs:tailor`, `cvs:cover-letter`, `cvs:ats-score`), charged to the key owner. <br>
Mitigation: Check the balance with `applytop account:credits` before running; failed AI generations are auto-refunded. <br>
Risk: The `--insecure` flag disables TLS verification. <br>
Mitigation: Use `--insecure` only against self-signed dev certs, never against production. <br>
Risk: The API enforces a per-key rate limit (100 requests/min). <br>
Mitigation: Back off and retry on `rate_limited`; avoid tight polling loops. <br>

## Reference(s): <br>
- [ApplyTop](https://applytop.com) <br>
- [ApplyTop CLI Docs](https://applytop.com/cli-docs) <br>
- [ApplyTop API Docs](https://applytop.com/api-docs) <br>
- [ApplyTop API Keys Dashboard](https://applytop.com/dashboard/api-keys) <br>
- [applytop on npm](https://www.npmjs.com/package/applytop) <br>
- [SKILL.md](SKILL.md) <br>
- [README](README.md) <br>

## Skill Output: <br>
**Output Type(s):** [text, markdown, api calls, json, shell commands, guidance] <br>
**Output Format:** [JSON payloads printed to stdout on success; `{ "error": { "code", "message", … } }` to stderr on failure. PDFs written to disk via `cvs:pdf`.] <br>
**Output Parameters:** [1D] <br>
**Other Properties Related to Output:** [Calls the ApplyTop public API (default `https://applytop.com/api/v1`); `jobs:search` defaults paginate via `--limit`/`--page`; exit `0` on success, `1` on error.] <br>

## Skill Version(s): <br>
0.1.1 (source: [package.json](package.json)) <br>

## Ethical Considerations: <br>
Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment. <br>

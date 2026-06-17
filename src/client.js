// ApplyTop public-API client. Plain ESM, zero runtime deps — uses Node's global
// `fetch` (Node >= 18). This class is the SDK and the engine behind every CLI
// command. The wire contract it speaks is documented in the ApplyTop repo at
// projects/applytop/docs/public-api.md.

export const DEFAULT_BASE_URL = 'https://applytop.com/api/v1';

// Thrown for any non-success API response (or transport failure). Carries the
// machine `code`, the HTTP `status`, and any extra fields the API attached — e.g.
// `balance`/`required`/`tier` on `insufficient_credits`, `template` on a premium gate.
export class ApplyTopError extends Error {
  constructor(code, message, extra = {}) {
    super(message || code);
    this.name = 'ApplyTopError';
    this.code = code;
    Object.assign(this, extra);
  }
}

export class ApplyTop {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, insecure = false } = {}) {
    this.apiKey = apiKey || null;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.insecure = !!insecure;
  }

  #requireKey() {
    if (!this.apiKey) {
      throw new ApplyTopError(
        'auth_required',
        'No API key. Run "applytop auth:login" or set APPLYTOP_API_KEY.'
      );
    }
  }

  #headers() {
    return { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey };
  }

  // POST a JSON body to `path`, returning the unwrapped `data` on success.
  async request(path, body = {}) {
    this.#requireKey();
    const url = this.baseUrl + path;
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: this.#headers(), body: JSON.stringify(body || {}) });
    } catch (err) {
      throw new ApplyTopError('network_error', `Could not reach ${url}: ${err.message}`);
    }
    let json;
    try {
      json = await res.json();
    } catch (_) {
      throw new ApplyTopError('bad_response', `Unexpected non-JSON response (HTTP ${res.status}) from ${url}`, { status: res.status });
    }
    if (json && json.success) return json.data;
    const { code, message, ...rest } = (json && json.error) || {};
    throw new ApplyTopError(code || 'error', message || `Request failed (HTTP ${res.status})`, { status: res.status, ...rest });
  }

  // ---- Account ----
  me() { return this.request('/me'); }
  credits() { return this.request('/credits'); }

  // ---- Jobs (public pool) ----
  jobsSearch(params = {}) { return this.request('/jobs/search', params); }
  jobsGet({ id, slug } = {}) { return this.request('/jobs/get', id ? { id } : { slug }); }

  // ---- Alerts / matches / saved (the caller's own data) ----
  alertsList(params = {}) { return this.request('/alerts', params); }
  alertsJobs(params = {}) { return this.request('/alerts/jobs', params); }
  matchesList(params = {}) { return this.request('/matches', params); }
  matchesGet(id) { return this.request('/matches/get', { id }); }
  savedList(params = {}) { return this.request('/saved', params); }

  // ---- CVs (+ AI tools) ----
  cvsList() { return this.request('/cvs/list'); }
  cvsGet(cvId) { return this.request('/cvs/get', { cvId }); }
  cvsAtsScore(cvId) { return this.request('/cvs/ats-score', { cvId }); }
  cvsTailorToJob({ jobId, cvId, template } = {}) { return this.request('/cvs/tailor-to-job', { jobId, cvId, template }); }
  cvsCoverLetterForJob({ jobId, cvId, hiringManager } = {}) { return this.request('/cvs/cover-letter-for-job', { jobId, cvId, hiringManager }); }

  // Download a CV as a PDF — resolves to a Buffer. On a JSON error body (e.g. a
  // premium-template gate) it parses and throws ApplyTopError like request().
  async cvsDownloadPdf(cvId, { template } = {}) {
    this.#requireKey();
    const url = this.baseUrl + '/cvs/download-pdf';
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: this.#headers(), body: JSON.stringify({ cvId, template }) });
    } catch (err) {
      throw new ApplyTopError('network_error', `Could not reach ${url}: ${err.message}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/pdf')) {
      return Buffer.from(await res.arrayBuffer());
    }
    let json = null;
    try { json = await res.json(); } catch (_) { /* non-JSON error body */ }
    const { code, message, ...rest } = (json && json.error) || {};
    throw new ApplyTopError(code || 'error', message || `PDF download failed (HTTP ${res.status})`, { status: res.status, ...rest });
  }
}

export default ApplyTop;

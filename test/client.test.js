import { expect } from 'chai';
import { ApplyTop, ApplyTopError } from '../src/client.js';

// Stub the global fetch and capture every call. Returns the calls array.
function stubFetch(handler) {
  const calls = [];
  global.fetch = async (url, opts) => { calls.push({ url, opts }); return handler(url, opts, calls); };
  return calls;
}

function jsonResponse(body, { status = 200, ok = true, contentType = 'application/json' } = {}) {
  return {
    ok,
    status,
    headers: { get: (h) => (String(h).toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => body,
    arrayBuffer: async () => Buffer.from(''),
  };
}

describe('ApplyTop client', () => {
  const origFetch = global.fetch;
  afterEach(() => { global.fetch = origFetch; });

  it('sends X-API-Key + JSON body and unwraps data', async () => {
    const calls = stubFetch(() => jsonResponse({ success: true, data: { total: 3, jobs: [] } }));
    const c = new ApplyTop({ apiKey: 'at_live_test', baseUrl: 'https://x/api/v1' });
    const data = await c.jobsSearch({ q: 'engineer', limit: 3 });
    expect(data).to.deep.equal({ total: 3, jobs: [] });
    expect(calls[0].url).to.equal('https://x/api/v1/jobs/search');
    expect(calls[0].opts.method).to.equal('POST');
    expect(calls[0].opts.headers['X-API-Key']).to.equal('at_live_test');
    expect(JSON.parse(calls[0].opts.body)).to.deep.equal({ q: 'engineer', limit: 3 });
  });

  it('trims a trailing slash on baseUrl', async () => {
    const calls = stubFetch(() => jsonResponse({ success: true, data: {} }));
    const c = new ApplyTop({ apiKey: 'k', baseUrl: 'https://x/api/v1/' });
    await c.me();
    expect(calls[0].url).to.equal('https://x/api/v1/me');
  });

  it('throws ApplyTopError with code/status/extra on a failure envelope', async () => {
    stubFetch(() => jsonResponse(
      { success: false, error: { code: 'insufficient_credits', message: 'no', balance: 0, required: 1, tier: 'free' } },
      { ok: false, status: 402 }
    ));
    const c = new ApplyTop({ apiKey: 'k' });
    try {
      await c.cvsAtsScore('cv1');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ApplyTopError);
      expect(e.code).to.equal('insufficient_credits');
      expect(e.status).to.equal(402);
      expect(e.balance).to.equal(0);
      expect(e.required).to.equal(1);
      expect(e.tier).to.equal('free');
    }
  });

  it('requires an apiKey before making a request', async () => {
    const c = new ApplyTop({});
    try {
      await c.me();
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.code).to.equal('auth_required');
    }
  });

  it('jobsGet sends id when given, else slug', async () => {
    const calls = stubFetch(() => jsonResponse({ success: true, data: { job: {} } }));
    const c = new ApplyTop({ apiKey: 'k', baseUrl: 'https://x/api/v1' });
    await c.jobsGet({ slug: 'abc' });
    expect(JSON.parse(calls[0].opts.body)).to.deep.equal({ slug: 'abc' });
    await c.jobsGet({ id: 'id1' });
    expect(JSON.parse(calls[1].opts.body)).to.deep.equal({ id: 'id1' });
  });

  it('omits undefined params from the body', async () => {
    const calls = stubFetch(() => jsonResponse({ success: true, data: {} }));
    const c = new ApplyTop({ apiKey: 'k', baseUrl: 'https://x/api/v1' });
    await c.cvsTailorToJob({ jobId: 'job1' }); // cvId + template undefined
    expect(JSON.parse(calls[0].opts.body)).to.deep.equal({ jobId: 'job1' });
  });

  it('cvsDownloadPdf returns a Buffer on a PDF response', async () => {
    const pdf = Buffer.from('%PDF-1.4 hello');
    stubFetch(() => ({
      ok: true, status: 200,
      headers: { get: (h) => (String(h).toLowerCase() === 'content-type' ? 'application/pdf' : null) },
      arrayBuffer: async () => pdf,
      json: async () => ({}),
    }));
    const c = new ApplyTop({ apiKey: 'k' });
    const buf = await c.cvsDownloadPdf('cv1', { template: 'modern' });
    expect(Buffer.isBuffer(buf)).to.equal(true);
    expect(buf.toString()).to.contain('%PDF');
  });

  it('cvsDownloadPdf throws on a JSON error body (premium gate)', async () => {
    stubFetch(() => ({
      ok: false, status: 402,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false, error: { code: 'premium_template_requires_pro', message: 'x', template: 'executive' } }),
      arrayBuffer: async () => Buffer.from(''),
    }));
    const c = new ApplyTop({ apiKey: 'k' });
    try {
      await c.cvsDownloadPdf('cv1', { template: 'executive' });
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.code).to.equal('premium_template_requires_pro');
      expect(e.template).to.equal('executive');
    }
  });

  it('wraps transport failures as network_error', async () => {
    stubFetch(() => { throw new Error('ECONNREFUSED'); });
    const c = new ApplyTop({ apiKey: 'k', baseUrl: 'https://x/api/v1' });
    try {
      await c.me();
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.code).to.equal('network_error');
    }
  });
});

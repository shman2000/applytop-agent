import { expect } from 'chai';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// config.js resolves ~/.applytop from os.homedir() at import time, and homedir()
// honors $HOME on POSIX — so set a temp HOME, then DYNAMIC-import config.js.
describe('config', () => {
  let config;
  let tmpHome;
  const saved = {};

  before(async () => {
    for (const k of ['HOME', 'APPLYTOP_API_KEY', 'APPLYTOP_API_URL', 'APPLYTOP_INSECURE']) saved[k] = process.env[k];
    tmpHome = mkdtempSync(join(tmpdir(), 'at-cli-'));
    process.env.HOME = tmpHome;
    delete process.env.APPLYTOP_API_KEY;
    delete process.env.APPLYTOP_API_URL;
    delete process.env.APPLYTOP_INSECURE;
    config = await import('../src/config.js');
  });

  after(() => {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    try { rmSync(tmpHome, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  });

  afterEach(() => {
    config.clearCreds();
    delete process.env.APPLYTOP_API_KEY;
    delete process.env.APPLYTOP_API_URL;
  });

  it('writes, reads, and clears credentials', () => {
    config.writeCreds({ apiKey: 'at_live_x', baseUrl: 'https://example.com/api/v1' });
    expect(config.readCreds()).to.deep.include({ apiKey: 'at_live_x', baseUrl: 'https://example.com/api/v1' });
    config.clearCreds();
    expect(config.readCreds()).to.equal(null);
  });

  it('resolveAuth precedence is flag > env > file', () => {
    config.writeCreds({ apiKey: 'file_key', baseUrl: 'https://file/api' });

    expect(config.resolveAuth({}).apiKey).to.equal('file_key');
    expect(config.resolveAuth({}).source).to.equal('file');

    process.env.APPLYTOP_API_KEY = 'env_key';
    expect(config.resolveAuth({}).apiKey).to.equal('env_key');
    expect(config.resolveAuth({}).source).to.equal('env');

    expect(config.resolveAuth({ apiKey: 'flag_key' }).apiKey).to.equal('flag_key');
    expect(config.resolveAuth({ apiKey: 'flag_key' }).source).to.equal('flag');
  });

  it('defaults the base URL to production when nothing is set', () => {
    expect(config.resolveAuth({}).baseUrl).to.equal('https://applytop.com/api/v1');
  });

  it('resolves insecure from the flag or APPLYTOP_INSECURE', () => {
    expect(config.resolveAuth({}).insecure).to.equal(false);
    expect(config.resolveAuth({ insecure: true }).insecure).to.equal(true);
    process.env.APPLYTOP_INSECURE = '1';
    expect(config.resolveAuth({}).insecure).to.equal(true);
    delete process.env.APPLYTOP_INSECURE;
  });
});

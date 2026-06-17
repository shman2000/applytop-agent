// Output helpers. Commands print JSON to stdout (script-friendly); errors go to
// stderr as { error: { code, message, ... } } with a non-zero exit code.

const EXTRA_KEYS = ['status', 'balance', 'required', 'tier', 'template'];

export function printJson(value, { raw = false } = {}) {
  process.stdout.write(JSON.stringify(value, null, raw ? 0 : 2) + '\n');
}

// Print a command's successful result, honoring the global --raw flag read from
// the commander Command instance.
export function emit(command, data) {
  const raw = command && typeof command.optsWithGlobals === 'function' ? !!command.optsWithGlobals().raw : false;
  printJson(data, { raw });
}

export function printError(err, { raw = false } = {}) {
  let error;
  if (err && err.name === 'ApplyTopError') {
    error = { code: err.code, message: err.message };
    for (const k of EXTRA_KEYS) if (err[k] !== undefined) error[k] = err[k];
  } else {
    error = { code: 'cli_error', message: (err && err.message) || String(err) };
  }
  process.stderr.write(JSON.stringify({ error }, null, raw ? 0 : 2) + '\n');
}

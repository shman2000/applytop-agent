// Shared option coercers for command definitions.

// Parse an integer option value; undefined when not a number so the client omits it.
export function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

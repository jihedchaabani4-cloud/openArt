// [FSD Layer: shared/lib] Frontend structured logger.
// Owns: every client-side log line. This is the ONLY module allowed to write to the console.
// Public: logger.debug / logger.info / logger.warn / logger.error (event, fields?)
//
// Rules for callers:
// - `event` is a short snake_case name (e.g. "optimistic_mutation_failed").
// - `fields` must NEVER contain secrets, tokens, signed URLs or user prompts.
// - Error objects are reduced to { name, message } (no stack, no response body).

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// Production: errors only. Elsewhere (dev, test): everything.
const MIN_LEVEL = process.env.NODE_ENV === "production" ? LEVELS.error : LEVELS.debug;

function serialize(fields) {
  if (!fields || typeof fields !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = value instanceof Error ? { name: value.name, message: value.message } : value;
  }
  return out;
}

function write(level, event, fields) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const record = { level, event, ts: new Date().toISOString(), ...serialize(fields) };
  // Single console sink, resolved at call time so tests can spy on it.
  console[level](record);
}

export const logger = {
  debug: (event, fields) => write("debug", event, fields),
  info: (event, fields) => write("info", event, fields),
  warn: (event, fields) => write("warn", event, fields),
  error: (event, fields) => write("error", event, fields),
};

export default logger;

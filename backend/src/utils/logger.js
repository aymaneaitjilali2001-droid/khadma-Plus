const REDACT_KEYS = ['apikey', 'api_key', 'authorization', 'password', 'token'];

function redact(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const clone = Array.isArray(meta) ? [...meta] : { ...meta };
  for (const key of Object.keys(clone)) {
    if (REDACT_KEYS.includes(key.toLowerCase())) {
      clone[key] = '[REDACTED]';
    } else if (clone[key] && typeof clone[key] === 'object') {
      clone[key] = redact(clone[key]);
    }
  }
  return clone;
}

function timestamp() {
  return new Date().toISOString();
}

function log(level, message, meta) {
  const safeMeta = meta ? redact(meta) : undefined;
  const line = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  const sink = level === 'error' ? console.error : console.log;
  if (safeMeta) {
    sink(line, safeMeta);
  } else {
    sink(line);
  }
}

export default {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') log('debug', msg, meta);
  },
};

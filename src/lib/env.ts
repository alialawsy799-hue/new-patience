import './load-env';

/**
 * Typed, validated access to server configuration.
 *
 * Nothing in this module may ever be imported from a client component: every
 * value here is a server secret or a server-only switch. The single public
 * value (site URL) is re-exported through `publicEnv`.
 */

class EnvError extends Error {
  constructor(message: string) {
    super(`[env] ${message}`);
    this.name = 'EnvError';
  }
}

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new EnvError(
      `Missing required environment variable "${key}". Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value.trim();
}

function optional(key: string, fallback = ''): string {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function integer(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) throw new EnvError(`"${key}" must be an integer, received "${raw}".`);
  return parsed;
}

/** Secrets must decode to at least 32 bytes of entropy. */
function secret(key: string, exactBytes?: number): string {
  const value = required(key);
  if (value.startsWith('replace-me')) {
    throw new EnvError(`"${key}" still holds the placeholder value from .env.example.`);
  }
  const bytes = Buffer.from(value, 'base64');
  const length = bytes.length > 0 ? bytes.length : Buffer.byteLength(value, 'utf8');
  if (exactBytes !== undefined && length !== exactBytes) {
    throw new EnvError(`"${key}" must decode to exactly ${exactBytes} bytes (got ${length}).`);
  }
  if (length < 32) {
    throw new EnvError(`"${key}" must provide at least 32 bytes of entropy (got ${length}).`);
  }
  return value;
}

const nodeEnv = optional('NODE_ENV', 'development') as 'development' | 'production' | 'test';
const isProduction = nodeEnv === 'production';

const databaseDriver = optional('DATABASE_DRIVER', 'pglite') as 'pglite' | 'postgres';
if (databaseDriver !== 'pglite' && databaseDriver !== 'postgres') {
  throw new EnvError('DATABASE_DRIVER must be either "pglite" or "postgres".');
}
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
if (isProduction && databaseDriver === 'pglite' && !isBuild) {
  throw new EnvError(
    'DATABASE_DRIVER=pglite is a development-only convenience. Set DATABASE_DRIVER=postgres and DATABASE_URL in production.',
  );
}

export const env = {
  nodeEnv,
  isProduction,
  isDevelopment: nodeEnv === 'development',

  siteUrl: optional('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, ''),

  database: {
    driver: databaseDriver,
    url: databaseDriver === 'postgres' ? required('DATABASE_URL') : optional('DATABASE_URL'),
    pgliteDir: optional('PGLITE_DATA_DIR', './.data/patience-db'),
  },

  secrets: {
    session: secret('SESSION_SECRET'),
    codePepper: secret('CODE_HASH_PEPPER'),
    codeEncryption: secret('CODE_ENCRYPTION_KEY', 32),
  },

  sessions: {
    studentDays: integer('STUDENT_SESSION_DAYS', 90),
    adminHours: integer('ADMIN_SESSION_HOURS', 8),
  },

  seedAdmin: {
    email: optional('SEED_ADMIN_EMAIL', 'admin@patience.academy'),
    password: optional('SEED_ADMIN_PASSWORD', ''),
    name: optional('SEED_ADMIN_NAME', 'PATIENCE Administrator'),
  },

  seedStaff: {
    email: optional('SEED_STAFF_EMAIL', 'staff@patience.academy'),
    password: optional('SEED_STAFF_PASSWORD', 'PatienceStaff2025!'),
    name: optional('SEED_STAFF_NAME', 'موظفة المتجر'),
  },

  vimeo: {
    accessToken: optional('VIMEO_ACCESS_TOKEN'),
    allowedDomain: optional('VIMEO_ALLOWED_DOMAIN', 'localhost'),
  },

  telegram: {
    botToken: optional('TELEGRAM_BOT_TOKEN'),
    ordersChatId: optional('TELEGRAM_ORDERS_CHAT_ID'),
  },

  rateLimits: {
    activationMaxAttempts: integer('ACTIVATION_MAX_ATTEMPTS', 8),
    activationWindowMinutes: integer('ACTIVATION_WINDOW_MINUTES', 15),
    adminLoginMaxAttempts: integer('ADMIN_LOGIN_MAX_ATTEMPTS', 5),
    adminLoginWindowMinutes: integer('ADMIN_LOGIN_WINDOW_MINUTES', 15),
  },
} as const;

export type Env = typeof env;

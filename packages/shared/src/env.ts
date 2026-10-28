import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('PawStay'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),

  // Database & Cache
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, 'NEXTAUTH_SECRET must be at least 16 characters for testing, 32 in prod')
    .default('super_secret_pawstay_jwt_session_token_min_32_chars!'),
  GOOGLE_CLIENT_ID: z.string().default('mock_google_client_id'),
  GOOGLE_CLIENT_SECRET: z.string().default('mock_google_client_secret'),

  // Payments
  PAYMENT_PROVIDER: z.enum(['stripe', 'mock']).default('mock'),
  STRIPE_SECRET_KEY: z.string().default('sk_test_mock'),
  STRIPE_PUBLISHABLE_KEY: z.string().default('pk_test_mock'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_mock'),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().default('whsec_mock_connect'),
  DEFAULT_CURRENCY: z.string().default('USD'),
  DEFAULT_OWNER_SERVICE_FEE_BPS: z.coerce.number().int().default(700),
  DEFAULT_SITTER_COMMISSION_BPS: z.coerce.number().int().default(1200),

  // Storage
  STORAGE_PROVIDER: z.enum(['s3', 'minio', 'mock']).default('mock'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET_NAME: z.string().default('pawstay-media'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  NEXT_PUBLIC_CDN_URL: z.string().default('http://localhost:9000/pawstay-media'),

  // Realtime
  REALTIME_PROVIDER: z.enum(['pusher', 'ably', 'mock']).default('mock'),
  PUSHER_APP_ID: z.string().default('mock_app_id'),
  PUSHER_KEY: z.string().default('mock_key'),
  PUSHER_SECRET: z.string().default('mock_secret'),
  PUSHER_CLUSTER: z.string().default('us2'),

  // Email & Notifications
  EMAIL_PROVIDER: z.enum(['resend', 'mailhog', 'mock']).default('mock'),
  RESEND_API_KEY: z.string().default('re_mock'),
  EMAIL_FROM: z.string().default('PawStay <care@pawstay.local>'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),

  NOTIFIER_PROVIDER: z.enum(['twilio', 'mock']).default('mock'),
  TWILIO_ACCOUNT_SID: z.string().default('AC_mock'),
  TWILIO_AUTH_TOKEN: z.string().default('mock_token'),
  TWILIO_PHONE_NUMBER: z.string().default('+15551234567'),

  // Geocoding
  GEO_PROVIDER: z.enum(['mapbox', 'google', 'mock']).default('mock'),
  MAPBOX_ACCESS_TOKEN: z.string().default('pk.mock'),
  GOOGLE_MAPS_API_KEY: z.string().default('mock_key'),

  // Identity Verification
  IDENTITY_VERIFIER_PROVIDER: z.enum(['stripe_identity', 'persona', 'mock']).default('mock'),
  BACKGROUND_CHECK_PROVIDER: z.enum(['checkr', 'mock']).default('mock'),

  // Observability & Security
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(''),
  SENTRY_AUTH_TOKEN: z.string().optional().default(''),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional().default(''),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().default(''),
  TURNSTILE_SECRET_KEY: z.string().optional().default(''),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(rawEnv: Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse(rawEnv);
  if (!result.success) {
    const issues = (result.error.issues ?? (result.error as any).errors ?? []) as Array<{
      path: Array<string | number>;
      message: string;
    }>;
    const message = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.error('Invalid environment configuration:', message);
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  return result.data;
}

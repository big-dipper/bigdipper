/** Filled in once the Railway template exists (Railway → Templates → your template → Share). Empty hides the button. */
/** Big Dipper's Railway referral code. Every link to Railway carries it, so sign-ups and deploys are credited. */
export const RAILWAY_REFERRAL = 'P8Q93G';
export const RAILWAY_TEMPLATE_URL = `https://railway.com/deploy/otW6sk?referralCode=${RAILWAY_REFERRAL}`;
/** Railway's sign-up, with the referral code (Railway's documented referral link format). */
export const RAILWAY_SIGNUP_URL = `https://railway.com/?referralCode=${RAILWAY_REFERRAL}`;
/** What a Little Dipper costs on Railway each month, shown before anyone starts. Confirm after the first real deploy. */
export const RAILWAY_MONTHLY = 'about $5';
/** The shared demo: one click signs you in as Maya. Refilled every hour (Little Dipper's scripts/demo.ts --hosted). */
export const DEMO_URL = 'https://little-dipper-demo.onrender.com/api/auth/demo';
/** Big Dipper's service (hosting, feedback). PUBLIC_BD_SERVICE_URL overrides it, e.g. a local copy while testing. */
export const SERVICE_URL = (import.meta.env.PUBLIC_BD_SERVICE_URL || 'https://big-dipper-service.onrender.com').replace(/\/+$/, '');

/** Big Dipper Hosting: what people see before they start. Prices and the trial are public (owner, Nov 19 2026). */
export const HOSTED_MONTHLY = '$10';
export const TRIAL_DAYS = 30;
/** The companies behind our hosting. Names only until we have permission to show their logos. */
export const HOST_PARTNER = 'Fly.io';
export const BACKUP_PARTNER = 'DigitalOcean';

/**
 * Force an access-token refresh and report status (sanity check for OAuth2 creds).
 * Usage: npm run refresh-token
 */
import { getAccessToken } from './_shared/ml-client.mjs';

try {
  const token = await getAccessToken();
  console.log('✅ Access token OK:', token.slice(0, 16) + '… (cacheado en data/.token-cache.json)');
} catch (err) {
  console.error('❌', err.message);
  process.exit(1);
}

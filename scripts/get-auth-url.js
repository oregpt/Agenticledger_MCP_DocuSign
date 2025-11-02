/**
 * Generate DocuSign OAuth Authorization URL
 *
 * This will generate a URL for you to visit in your browser.
 * After authorizing, you'll get a code that we can exchange for a token.
 */

const INTEGRATION_KEY = 'a36fc35b-aeaa-49a9-a55a-4139ec538e1d';
const REDIRECT_URI = 'http://localhost:3000/callback'; // You can use any URI configured in DocuSign
const OAUTH_BASE_PATH = 'account-d.docusign.com'; // Demo environment
const SCOPES = ['signature', 'impersonation'];

console.log('\n============================================================');
console.log('  DOCUSIGN OAUTH AUTHORIZATION');
console.log('============================================================\n');

console.log('STEP 1: Visit this URL in your browser:\n');

const authUrl = `https://${OAUTH_BASE_PATH}/oauth/auth?` +
  `response_type=code&` +
  `scope=${SCOPES.join('%20')}&` +
  `client_id=${INTEGRATION_KEY}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log(authUrl);

console.log('\n\nSTEP 2: After authorizing, you will be redirected to:');
console.log(`${REDIRECT_URI}?code=AUTHORIZATION_CODE`);
console.log('\nCopy the "code" parameter from the URL and provide it to me.\n');

console.log('============================================================\n');

console.log('ALTERNATIVE (FASTER): Use DocuSign OAuth Token Generator');
console.log('https://developers.docusign.com/oauth-token-generator');
console.log('\nJust log in, select scopes (signature, impersonation),');
console.log('and click "Get Access Token". Paste the token here.\n');

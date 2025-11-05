/**
 * Simple OAuth Token Helper for DocuSign
 *
 * Step 1: Run this script to get authorization URL
 * Step 2: Visit URL in browser and authorize
 * Step 3: Copy the code from redirect URL
 * Step 4: Run: node get-token-simple.js YOUR_CODE_HERE
 */

const INTEGRATION_KEY = 'a36fc35b-aeaa-49a9-a55a-4139ec538e1d';
const CLIENT_SECRET = process.env.DOCUSIGN_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';
const OAUTH_BASE_PATH = 'account-d.docusign.com';
const SCOPES = ['signature', 'impersonation'];

const authorizationCode = process.argv[2];

if (!authorizationCode) {
  // Step 1: Show authorization URL
  console.log('\n============================================================');
  console.log('  STEP 1: GET AUTHORIZATION CODE');
  console.log('============================================================\n');

  const authUrl = `https://${OAUTH_BASE_PATH}/oauth/auth?` +
    `response_type=code&` +
    `scope=${SCOPES.join('%20')}&` +
    `client_id=${INTEGRATION_KEY}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  console.log('Visit this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n\nAfter authorizing, you will be redirected to:');
  console.log('http://localhost:3000/callback?code=XXXXXXXXX\n');
  console.log('The page will NOT load (that\'s OK!)');
  console.log('Just copy the entire URL from your browser address bar.\n');
  console.log('============================================================\n');
  console.log('STEP 2: Run this script with the code:\n');
  console.log('node get-token-simple.js YOUR_CODE_HERE\n');
  console.log('Or paste the full URL:\n');
  console.log('node get-token-simple.js "http://localhost:3000/callback?code=XXXXX"\n');
  process.exit(0);
}

// Step 2: Exchange code for token
console.log('\n============================================================');
console.log('  STEP 2: EXCHANGE CODE FOR TOKEN');
console.log('============================================================\n');

// Extract code from URL if full URL was pasted
let code = authorizationCode;
if (code.includes('?code=')) {
  code = code.split('?code=')[1].split('&')[0];
}

console.log('Authorization code:', code.substring(0, 20) + '...\n');

if (CLIENT_SECRET === 'YOUR_CLIENT_SECRET') {
  console.log('❌ Error: Client secret not set\n');
  console.log('You need to set your DocuSign client secret first.\n');
  console.log('Two options:\n');
  console.log('Option 1 - Set environment variable:');
  console.log('  $env:DOCUSIGN_CLIENT_SECRET="your_secret_here"\n');
  console.log('Option 2 - Edit this file and replace YOUR_CLIENT_SECRET\n');
  console.log('Get your client secret from:');
  console.log('  https://admindemo.docusign.com/ > Apps and Keys > AgenticLedger\n');
  process.exit(1);
}

// Exchange code for token
const tokenUrl = `https://${OAUTH_BASE_PATH}/oauth/token`;
const params = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  client_id: INTEGRATION_KEY,
  client_secret: CLIENT_SECRET,
  redirect_uri: REDIRECT_URI
});

console.log('Exchanging authorization code for access token...\n');

fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params.toString()
})
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.log('❌ Error:', data.error);
      console.log('Description:', data.error_description);
      console.log('\nTroubleshooting:');
      console.log('- Check that client secret is correct');
      console.log('- Check that redirect URI is registered in DocuSign');
      console.log('- Authorization code expires in 5 minutes - get a new one\n');
      process.exit(1);
    }

    console.log('✅ SUCCESS! Token obtained\n');
    console.log('============================================================');
    console.log('  YOUR ACCESS TOKEN');
    console.log('============================================================\n');
    console.log(data.access_token);
    console.log('\n============================================================');
    console.log('  TOKEN DETAILS');
    console.log('============================================================\n');
    console.log('Token Type:', data.token_type);
    console.log('Expires In:', data.expires_in, 'seconds (', Math.floor(data.expires_in / 3600), 'hours)');
    console.log('Refresh Token:', data.refresh_token ? 'Yes' : 'No');

    console.log('\n============================================================');
    console.log('  NEXT STEPS');
    console.log('============================================================\n');
    console.log('1. Copy the access token above\n');
    console.log('2. Set it as environment variable:\n');
    console.log('   $env:DOCUSIGN_ACCESS_TOKEN="' + data.access_token.substring(0, 30) + '..."\n');
    console.log('3. Run integration tests:\n');
    console.log('   npm run test:integration\n');

    // Save to .env file if it exists
    if (data.refresh_token) {
      console.log('Refresh Token (save this!):\n');
      console.log(data.refresh_token);
      console.log('\n');
    }
  })
  .catch(error => {
    console.log('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('- Client secret is correct');
    console.log('- Redirect URI is registered');
    console.log('- You have internet connection\n');
    process.exit(1);
  });

/**
 * Generate DocuSign Access Token using JWT Grant
 */

import docusign from 'docusign-esign';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INTEGRATION_KEY = 'a36fc35b-aeaa-49a9-a55a-4139ec538e1d';
const USER_ID = process.env.DOCUSIGN_USER_ID; // Your DocuSign user ID (email)
const OAUTH_BASE_PATH = 'account-d.docusign.com'; // Demo environment
const SCOPES = ['signature', 'impersonation'];

console.log('============================================================');
console.log('  DOCUSIGN JWT TOKEN GENERATOR');
console.log('============================================================\n');

// Check if we need to generate RSA key pair first
console.log('Note: DocuSign JWT Grant requires RSA key pair.');
console.log('You need to:');
console.log('1. Generate RSA key pair');
console.log('2. Add public key to DocuSign Integration Key settings');
console.log('3. Get your User ID (API Username) from DocuSign');
console.log('\nAlternatively, use the OAuth Token Generator (faster):');
console.log('https://developers.docusign.com/oauth-token-generator\n');

console.log('For JWT Grant setup, see:');
console.log('https://developers.docusign.com/platform/auth/jwt/jwt-get-token/\n');

process.exit(0);

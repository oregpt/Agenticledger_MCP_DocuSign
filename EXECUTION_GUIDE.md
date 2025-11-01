# DocuSign MCP Server - Execution Guide

**Quick reference for running and testing the DocuSign MCP Server**

---

## Prerequisites

1. **DocuSign Developer Account** (Free)
   - Sign up: https://developers.docusign.com/
   - Create Integration Key (Client ID)
   - Configure OAuth 2.0

2. **Node.js** >= 18.0.0

3. **OAuth Access Token**
   - Required for all testing
   - Valid for ~8 hours
   - Must be regenerated when expired

---

## Quick Start

### 1. Install Dependencies

```bash
cd "C:\Users\oreph\Documents\AgenticLedger\Custom MCP SERVERS\DocuSignMCP"
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

Expected output:
```
> @agenticledger/docusign-mcp-server@1.0.0 build
> tsc
```

### 3. Get DocuSign Access Token

#### Option A: Using DocuSign OAuth Explorer (Fastest)
1. Go to: https://developers.docusign.com/oauth-token-generator
2. Select scopes: `signature`, `impersonation`
3. Click "Get Access Token"
4. Copy token (valid for 8 hours)

#### Option B: OAuth Authorization Code Grant (Production)
```
1. Redirect user to:
   https://account-d.docusign.com/oauth/auth?
   response_type=code&
   scope=signature%20impersonation&
   client_id=YOUR_CLIENT_ID&
   redirect_uri=YOUR_REDIRECT_URI

2. User authorizes, you receive code

3. Exchange code for token:
   POST https://account-d.docusign.com/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&
   code=AUTHORIZATION_CODE&
   client_id=YOUR_CLIENT_ID&
   client_secret=YOUR_CLIENT_SECRET

4. Receive access token (valid for ~8 hours)
```

### 4. Run Integration Tests

```bash
# Set access token (Windows PowerShell)
$env:DOCUSIGN_ACCESS_TOKEN="your_token_here"

# Set access token (Windows CMD)
set DOCUSIGN_ACCESS_TOKEN=your_token_here

# Run tests
npm run test:integration
```

Expected output:
```
============================================================
  DOCUSIGN MCP SERVER - INTEGRATION TESTS
  Testing against: DocuSign Demo Environment
============================================================

▶ Test: List Available Templates
✅ PASSED (350ms)

▶ Test: List Recent Envelopes
✅ PASSED (420ms)

▶ Test: Validation - Missing accessToken
✅ PASSED (5ms)

▶ Test: Error Handling - Invalid Envelope ID
✅ PASSED (280ms)

============================================================
  TEST SUMMARY
============================================================
✅ Passed: 4
❌ Failed: 0
📊 Total: 4

🎉 ALL TESTS PASSED!
```

---

## Manual Testing

### Start MCP Server

```bash
node dist/index.js
```

Expected output:
```
DocuSign MCP Server running on stdio
```

The server is now listening on stdio for MCP protocol messages.

### Test Individual Tools

Create a test script:

```javascript
// test-manual.js
import { sendEnvelope } from './dist/tools.js';

const result = await sendEnvelope({
  accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
  documentBase64: 'JVBERi0xLjQKJeL...', // Your base64 doc
  documentName: 'test.pdf',
  recipients: [{
    email: 'test@example.com',
    name: 'Test User'
  }],
  emailSubject: 'Please sign this document',
  options: { status: 'created' } // Draft, doesn't send
});

console.log(JSON.stringify(result, null, 2));
```

Run:
```bash
node test-manual.js
```

---

## Common Tasks

### List Templates

```javascript
import { listTemplates } from './dist/tools.js';

const result = await listTemplates({
  accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
  options: {
    count: 10,
    searchText: 'contract'
  }
});

console.log(result.data.templates);
```

### Send Envelope (Draft)

```javascript
import { sendEnvelope } from './dist/tools.js';

const result = await sendEnvelope({
  accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
  documentBase64: 'JVBERi0xLjQKJeL...',
  documentName: 'contract.pdf',
  recipients: [{
    email: 'john.doe@company.com',
    name: 'John Doe'
  }],
  emailSubject: 'Employment Contract',
  emailBody: 'Please review and sign',
  options: {
    status: 'created' // Save as draft
  }
});

console.log('Envelope ID:', result.data.envelopeId);
```

### Check Envelope Status

```javascript
import { getEnvelopeStatus } from './dist/tools.js';

const result = await getEnvelopeStatus({
  accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
  envelopeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  options: {
    includeRecipients: true
  }
});

console.log('Status:', result.data.status);
console.log('Recipients:', result.data.recipients);
```

### Download Signed Document

```javascript
import { downloadDocument } from './dist/tools.js';
import fs from 'fs';

const result = await downloadDocument({
  accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
  envelopeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  documentId: '1'
});

// Save to file
const buffer = Buffer.from(result.data.documentBase64, 'base64');
fs.writeFileSync('signed-document.pdf', buffer);
console.log('Document saved!');
```

---

## Troubleshooting

### Error: "Please set DOCUSIGN_ACCESS_TOKEN environment variable"

**Cause:** Access token not set or expired

**Solution:**
```bash
# Get new token from DocuSign OAuth Explorer
# https://developers.docusign.com/oauth-token-generator

# Set token
$env:DOCUSIGN_ACCESS_TOKEN="new_token_here"

# Re-run tests
npm run test:integration
```

### Error: "Invalid or expired authentication credentials"

**Cause:** Access token expired (8-hour lifetime)

**Solution:**
1. Generate new token from DocuSign
2. Update environment variable
3. Retry request

### Error: "Envelope not found with ID: xxx"

**Cause:** Envelope ID doesn't exist or belongs to different account

**Solution:**
1. Verify envelope ID is correct
2. Check you're using the right DocuSign account
3. List envelopes to see available IDs:
   ```javascript
   await listEnvelopes({
     accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
     options: { count: 10 }
   });
   ```

### Error: "Template not found with ID: xxx"

**Cause:** Template ID doesn't exist or wrong account

**Solution:**
1. List available templates:
   ```javascript
   await listTemplates({
     accessToken: process.env.DOCUSIGN_ACCESS_TOKEN
   });
   ```
2. Use a valid template ID from the list

### Error: "One or more recipient email addresses are invalid"

**Cause:** Invalid email format in recipients array

**Solution:**
1. Verify email addresses are valid
2. Check for typos
3. Ensure email format: `name@domain.com`

### TypeScript Compilation Errors

**Cause:** Missing dependencies or outdated Node.js

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install

# Verify Node.js version
node --version  # Should be >= 18.0.0

# Rebuild
npm run build
```

---

## Development Commands

### Build
```bash
npm run build
```

### Watch Mode (Auto-rebuild)
```bash
npm run build -- --watch
```

### Run Tests
```bash
npm run test:integration
```

### Clean Build
```bash
rm -rf dist
npm run build
```

---

## Environment Support

### Demo (Sandbox) Environment
- Default for testing
- Base URL: `https://demo.docusign.net/restapi`
- Free developer accounts
- 1,000 requests/hour

### Production Environment
- Base URL: `https://www.docusign.net/restapi`
- Requires paid DocuSign account
- Higher rate limits
- Real legal agreements

**Note:** Server auto-detects environment from access token.

---

## Rate Limits

### Demo Environment
- 1,000 requests per hour
- Resets hourly

### Production Environment
- Varies by plan (typically 1,000+/hour)
- Contact DocuSign for higher limits

### Best Practices
- Cache template lists
- Batch envelope status checks
- Implement backoff on 429 errors
- Don't poll envelope status too frequently

---

## Testing Workflow

### 1. Basic Connectivity
```bash
# Test authentication and list templates
npm run test:integration
```

### 2. Create Test Envelope
```javascript
// Uncomment test in tests/test-docusign.js
// Run: npm run test:integration
```

### 3. Track Envelope
```javascript
// Use envelope ID from step 2
await getEnvelopeStatus({
  accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
  envelopeId: 'your-envelope-id'
});
```

### 4. Download Document (After Signing)
```javascript
await downloadDocument({
  accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
  envelopeId: 'your-envelope-id',
  documentId: '1'
});
```

---

## Integration with AgenticLedger Platform

### Platform Configuration

The platform should:
1. Implement OAuth 2.0 Authorization Code Grant
2. Store and refresh access tokens
3. Pass fresh token to MCP server on each tool call
4. Handle token expiration (8-hour lifetime)

### MCP Server Registration

Add to platform's MCP server config:
```json
{
  "mcpServers": {
    "docusign": {
      "command": "node",
      "args": ["C:\\Users\\oreph\\Documents\\AgenticLedger\\Custom MCP SERVERS\\DocuSignMCP\\dist\\index.js"],
      "name": "DocuSign eSignature",
      "description": "Send and manage electronic signature requests",
      "tools": [
        "send_envelope",
        "get_envelope_status",
        "list_envelopes",
        "create_envelope_from_template",
        "list_templates",
        "download_document",
        "void_envelope",
        "get_recipient_status"
      ]
    }
  }
}
```

---

## Files Structure

```
DocuSignMCP/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── tools.ts           # 8 tool implementations
│   ├── api.ts             # DocuSign API client wrapper
│   └── schemas.ts         # Zod validation schemas
├── dist/                  # Compiled JavaScript (generated)
├── tests/
│   └── test-docusign.js   # Integration test suite
├── package.json
├── tsconfig.json
├── README.md              # Full documentation
├── PLATFORM_INTEGRATION_REPORT.md  # Integration testing report
├── EXECUTION_GUIDE.md     # This file
└── RESEARCH_SUMMARY.md    # Research and decision rationale
```

---

## Quick Reference

### Get Token
```
https://developers.docusign.com/oauth-token-generator
```

### Build & Test
```bash
npm install
npm run build
$env:DOCUSIGN_ACCESS_TOKEN="your_token"
npm run test:integration
```

### Start Server
```bash
node dist/index.js
```

### Documentation
- README.md - Complete API documentation
- PLATFORM_INTEGRATION_REPORT.md - Testing report
- DocuSign API Docs: https://developers.docusign.com/docs/esign-rest-api/

---

**Last Updated:** 2025-11-01
**Version:** 1.0.0
**Status:** Ready for testing with valid OAuth token

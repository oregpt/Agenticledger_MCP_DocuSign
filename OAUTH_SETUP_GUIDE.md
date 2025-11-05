# DocuSign OAuth 2.0 Setup Guide
**For AgenticLedger Platform - Authorization Code Grant Flow**

---

## Overview

This guide walks you through setting up OAuth 2.0 **Authorization Code Grant** for the DocuSign MCP server. This is the recommended flow for user-facing applications like AgenticLedger.

### What You Already Have

✅ **Integration Key (Client ID):** `a36fc35b-aeaa-49a9-a55a-4139ec538e1d`
✅ **MCP Server Code:** Complete and ready
✅ **Helper Scripts:** `get-auth-url.js`, `generate-token.js`

### What You Need

- [ ] Client Secret (from DocuSign)
- [ ] Configure Redirect URI in DocuSign
- [ ] Get your first access token
- [ ] Implement token refresh (optional for testing)

---

## Step 1: Configure Your DocuSign Integration

### 1.1 Log into DocuSign Developer Account

1. Go to: https://admindemo.docusign.com/ (Demo environment)
2. Log in with your credentials
3. Go to **Settings** → **Apps and Keys**

### 1.2 Find Your Integration

1. You should see an integration with key: `a36fc35b-aeaa-49a9-a55a-4139ec538e1d`
2. Click on it to edit settings

### 1.3 Add Redirect URI

Add this redirect URI to your integration:
```
http://localhost:3000/callback
```

**For production later, add:**
```
https://your-agenticledger-domain.com/oauth/docusign/callback
```

### 1.4 Get Client Secret

1. Click **"Add Secret Key"** (if not already created)
2. **IMPORTANT:** Copy and save the secret immediately - it won't be shown again!
3. Store it securely (we'll need it)

### 1.5 Enable Required Scopes

Ensure these scopes are enabled:
- ✅ `signature` - For envelope operations
- ✅ `impersonation` - For acting on behalf of users

---

## Step 2: Quick Testing (Get Your First Token)

### Option A: DocuSign Token Generator (FASTEST - 2 minutes)

**Best for:** Quick testing without OAuth flow setup

1. Go to: https://developers.docusign.com/oauth-token-generator
2. Log in with your DocuSign account
3. Select scopes:
   - ✅ `signature`
   - ✅ `impersonation`
4. Click **"Generate Access Token"**
5. Copy the token
6. Use it for testing:

```powershell
# PowerShell
$env:DOCUSIGN_ACCESS_TOKEN="eyJ0eXAiOiJNVCIsImFsZ..."

# Test the server
npm run test:integration
```

**Token Lifetime:** 8 hours
**Refresh:** Generate new token when expired

---

### Option B: Authorization Code Grant Flow (PROPER OAUTH)

**Best for:** Production setup with automatic token refresh

#### Step 2.1: Create `.env` File

Create `.env` in the DocuSignMCP folder:

```bash
# DocuSign OAuth Configuration
DOCUSIGN_INTEGRATION_KEY=a36fc35b-aeaa-49a9-a55a-4139ec538e1d
DOCUSIGN_CLIENT_SECRET=your_secret_here
DOCUSIGN_REDIRECT_URI=http://localhost:3000/callback
DOCUSIGN_ENVIRONMENT=demo

# Optional: Store tokens (for testing)
DOCUSIGN_ACCESS_TOKEN=
DOCUSIGN_REFRESH_TOKEN=
```

#### Step 2.2: Get Authorization URL

```bash
cd "C:\Users\oreph\Documents\AgenticLedger\Custom MCP SERVERS\DocuSignMCP"
node scripts/get-auth-url.js
```

This will output a URL like:
```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=a36fc35b-aeaa-49a9-a55a-4139ec538e1d&redirect_uri=http://localhost:3000/callback
```

#### Step 2.3: Authorize in Browser

1. Copy the URL and paste it into your browser
2. Log in with your DocuSign account
3. Click **"Allow"** to authorize

#### Step 2.4: Get Authorization Code

After authorizing, you'll be redirected to:
```
http://localhost:3000/callback?code=eyJ0eXAi...
```

**The page won't load** (that's OK!) - just copy the `code` parameter from the URL.

Example:
```
http://localhost:3000/callback?code=eyJ0eXAiOiJKV1QiLCJhbGci...
                                     ^^^^^^^^^ Copy this part
```

#### Step 2.5: Exchange Code for Token

Run the token generation script:

```bash
node scripts/generate-token.js YOUR_AUTHORIZATION_CODE_HERE
```

This will:
1. Exchange the code for an access token
2. Get a refresh token (for automatic renewal)
3. Save tokens to `.env` file (optional)
4. Display the access token for immediate use

**Output:**
```
✅ Access Token: eyJ0eXAiOiJNVCIsImFsZ...
✅ Refresh Token: eyJ0eXAiOiJNVCIsImFsZ...
✅ Expires In: 28800 seconds (8 hours)
```

#### Step 2.6: Test with Token

```powershell
# Set token
$env:DOCUSIGN_ACCESS_TOKEN="eyJ0eXAiOiJNVCIsImFsZ..."

# Run tests
npm run test:integration
```

---

## Step 3: Understanding Token Lifecycle

### Access Token
- **Lifetime:** 8 hours
- **Purpose:** Used for API calls
- **When expired:** Get new token using refresh token

### Refresh Token
- **Lifetime:** 30 days
- **Purpose:** Get new access tokens without re-authorization
- **When expired:** User must re-authorize

### Token Refresh Flow

When access token expires (after 8 hours):

```javascript
// Pseudo-code for platform implementation
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://account-d.docusign.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: INTEGRATION_KEY,
      client_secret: CLIENT_SECRET
    })
  });

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token, // New refresh token
    expiresIn: data.expires_in
  };
}
```

---

## Step 4: Platform Integration (AgenticLedger)

### How It Should Work in Production

```
┌─────────────┐
│   User      │
│  Browser    │
└─────┬───────┘
      │ 1. "Connect DocuSign"
      ▼
┌─────────────────────┐
│  AgenticLedger      │
│  Platform           │
│  (Web Server)       │
└─────┬───────────────┘
      │ 2. Redirect to DocuSign OAuth
      ▼
┌─────────────────────┐
│  DocuSign           │
│  OAuth Server       │
│  account-d.docusign │
└─────┬───────────────┘
      │ 3. User authorizes
      │ 4. Redirect with code
      ▼
┌─────────────────────┐
│  AgenticLedger      │
│  Callback Endpoint  │
│  /oauth/callback    │
└─────┬───────────────┘
      │ 5. Exchange code for tokens
      │ 6. Store tokens in database
      ▼
┌─────────────────────┐
│  Database           │
│  User: tokens       │
└─────────────────────┘
      │
      │ When AI agent needs DocuSign:
      ▼
┌─────────────────────┐
│  DocuSign           │
│  MCP Server         │
│  (This project)     │
└─────────────────────┘
      │ Receives fresh accessToken
      │ Makes API calls
      ▼
┌─────────────────────┐
│  DocuSign API       │
└─────────────────────┘
```

### Platform Responsibilities

**AgenticLedger platform should:**

1. **OAuth Flow:**
   - Implement `/oauth/docusign/connect` endpoint (initiate flow)
   - Implement `/oauth/docusign/callback` endpoint (handle code)
   - Store tokens securely per user

2. **Token Management:**
   - Store access token + refresh token in database
   - Track expiration time
   - Auto-refresh before expiration
   - Handle refresh token expiration (re-auth required)

3. **MCP Server Calls:**
   - Get fresh access token from database
   - Pass to MCP server via `accessToken` parameter
   - Never expose tokens to client-side JavaScript

### MCP Server Responsibilities

**DocuSign MCP Server (this project):**

✅ Receives `accessToken` via tool parameters
✅ Uses token for DocuSign API calls
✅ Returns results in standard format
❌ Does NOT store tokens
❌ Does NOT implement OAuth flow
❌ Does NOT refresh tokens

---

## Step 5: Testing Checklist

### Basic Connectivity Test

```bash
# 1. Verify build
npm run build

# 2. Set token
$env:DOCUSIGN_ACCESS_TOKEN="your_token_here"

# 3. Run integration tests
npm run test:integration
```

**Expected output:**
```
✅ Test: List Templates - PASSED
✅ Test: List Envelopes - PASSED
✅ Test: Validation - PASSED
✅ Test: Error Handling - PASSED

🎉 ALL TESTS PASSED
```

### Test Individual Tools

Create `test-manual.js`:

```javascript
import { listTemplates } from './dist/tools.js';

const token = process.env.DOCUSIGN_ACCESS_TOKEN;

const result = await listTemplates({
  accessToken: token,
  options: { count: 5 }
});

console.log(JSON.stringify(result, null, 2));
```

Run:
```bash
node test-manual.js
```

---

## Step 6: Production Deployment

### Environment Variables

**For demo/testing:**
```bash
DOCUSIGN_INTEGRATION_KEY=a36fc35b-aeaa-49a9-a55a-4139ec538e1d
DOCUSIGN_CLIENT_SECRET=your_demo_secret
DOCUSIGN_ENVIRONMENT=demo
```

**For production:**
```bash
DOCUSIGN_INTEGRATION_KEY=your_production_key
DOCUSIGN_CLIENT_SECRET=your_production_secret
DOCUSIGN_ENVIRONMENT=production
```

### Security Best Practices

1. **Never commit secrets:**
   - Add `.env` to `.gitignore`
   - Use environment variables
   - Store secrets in secure vault

2. **Token storage:**
   - Encrypt tokens in database
   - Use secure connection (HTTPS)
   - Set proper database permissions

3. **Redirect URIs:**
   - Use HTTPS in production
   - Whitelist exact URIs in DocuSign
   - Validate state parameter (CSRF protection)

4. **Monitoring:**
   - Log OAuth failures
   - Track token refresh rates
   - Alert on repeated auth failures

---

## Troubleshooting

### "Invalid client credentials"

**Cause:** Wrong client ID or secret

**Solution:**
1. Verify Integration Key: `a36fc35b-aeaa-49a9-a55a-4139ec538e1d`
2. Check client secret is correct
3. Ensure using demo environment keys for demo testing

### "Redirect URI mismatch"

**Cause:** URI in request doesn't match DocuSign configuration

**Solution:**
1. Go to DocuSign Apps and Keys
2. Add exact redirect URI: `http://localhost:3000/callback`
3. URI must match exactly (including protocol, port, path)

### "Invalid authorization code"

**Cause:** Code already used or expired

**Solution:**
1. Authorization codes expire in 5 minutes
2. Can only be used once
3. Get a new code by re-authorizing

### "Token expired"

**Cause:** Access token expired (8-hour lifetime)

**Solution:**
1. Use refresh token to get new access token
2. Or generate new token from DocuSign token generator

---

## Quick Reference

### Get Token (Fastest)
```
https://developers.docusign.com/oauth-token-generator
```

### Test Server
```bash
$env:DOCUSIGN_ACCESS_TOKEN="your_token"
npm run test:integration
```

### OAuth Flow URLs

**Demo Environment:**
- Authorization: `https://account-d.docusign.com/oauth/auth`
- Token Exchange: `https://account-d.docusign.com/oauth/token`
- User Info: `https://account-d.docusign.com/oauth/userinfo`

**Production Environment:**
- Authorization: `https://account.docusign.com/oauth/auth`
- Token Exchange: `https://account.docusign.com/oauth/token`
- User Info: `https://account.docusign.com/oauth/userinfo`

---

## Resources

**DocuSign OAuth Documentation:**
- https://developers.docusign.com/platform/auth/authcode/

**OAuth 2.0 Specification:**
- https://oauth.net/2/

**Token Generator (Quick Testing):**
- https://developers.docusign.com/oauth-token-generator

**Admin Console:**
- Demo: https://admindemo.docusign.com/
- Production: https://admin.docusign.com/

---

**Last Updated:** 2025-11-04
**Flow Type:** Authorization Code Grant
**Status:** Ready for implementation

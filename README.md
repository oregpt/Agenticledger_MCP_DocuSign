# DocuSign MCP Server

**Version:** 1.0.0
**Platform:** AgenticLedger
**Status:** Production Ready (Pending Real API Testing)

A Model Context Protocol (MCP) server for DocuSign electronic signature and agreement management. Built for the AgenticLedger platform using the official DocuSign eSignature REST API.

## Overview

This MCP server enables AI agents to interact with DocuSign's electronic signature platform, allowing them to send documents for signature, track envelope status, manage templates, and handle the complete document signing workflow.

## Authentication Pattern

**Pattern:** OAuth 2.0 (Direct access token)

### Token Format

```typescript
accessToken: "eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNG..."
```

**How to get token:**
1. Create a DocuSign Developer Account (free): https://developers.docusign.com/
2. Create an Integration Key (Client ID)
3. Use OAuth 2.0 Authorization Code Grant to obtain access token
4. Platform handles OAuth flow, MCP server receives access token

**Token Requirements:**
- OAuth 2.0 access token from DocuSign
- Scopes needed: `signature`, `impersonation`
- Works with both Demo (sandbox) and Production environments

## Available Tools

### 1. send_envelope

Send a document for electronic signature.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `documentBase64` (string, required): Base64-encoded document (PDF, DOCX, etc.)
- `documentName` (string, required): Document filename (e.g., "Contract.pdf")
- `recipients` (array, required): List of recipients
  - `email` (string): Recipient email address
  - `name` (string): Recipient full name
  - `role` (string, optional): "signer", "carbon_copy", or "certified_delivery"
- `emailSubject` (string, required): Email subject line
- `emailBody` (string, optional): Custom email message
- `options` (object, optional):
  - `status` (string): "sent" (immediate) or "created" (draft)
  - `accountId` (string): Specific DocuSign account ID

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  documentBase64: "JVBERi0xLjQKJeL...",
  documentName: "Employment_Contract.pdf",
  recipients: [{
    email: "john.doe@company.com",
    name: "John Doe",
    role: "signer"
  }],
  emailSubject: "Please sign: Employment Contract",
  emailBody: "Please review and sign the attached employment contract",
  options: {
    status: "sent"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "envelopeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "sent",
    "statusDateTime": "2025-11-01T12:00:00Z",
    "uri": "/envelopes/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 2. get_envelope_status

Get the current status and details of an envelope.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `envelopeId` (string, required): Envelope ID to check
- `options` (object, optional):
  - `accountId` (string): Specific DocuSign account ID
  - `includeRecipients` (boolean): Include recipient details (default: true)

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  envelopeId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  options: {
    includeRecipients: true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "envelopeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "completed",
    "statusDateTime": "2025-11-01T14:30:00Z",
    "emailSubject": "Please sign: Employment Contract",
    "sender": {
      "email": "sender@company.com",
      "name": "HR Department"
    },
    "recipients": [{
      "email": "john.doe@company.com",
      "name": "John Doe",
      "status": "completed",
      "signedDateTime": "2025-11-01T14:25:00Z"
    }]
  }
}
```

---

### 3. list_envelopes

List envelopes for an account with optional filtering.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `options` (object, optional):
  - `accountId` (string): Specific DocuSign account ID
  - `status` (string): Filter by status ("sent", "delivered", "completed", "declined", "voided", "all")
  - `fromDate` (string): Start date (ISO 8601: YYYY-MM-DD)
  - `toDate` (string): End date (ISO 8601: YYYY-MM-DD)
  - `count` (number): Max results (1-100, default: 20)

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  options: {
    status: "completed",
    fromDate: "2025-10-01",
    count: 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "envelopes": [
      {
        "envelopeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "completed",
        "emailSubject": "Employment Contract",
        "sentDateTime": "2025-11-01T12:00:00Z"
      }
    ],
    "totalCount": 1
  }
}
```

---

### 4. create_envelope_from_template

Create and send an envelope using a pre-configured template.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `templateId` (string, required): Template ID to use
- `recipients` (array, required): Recipients mapped to template roles
  - `email` (string): Recipient email
  - `name` (string): Recipient name
  - `roleName` (string): Role name from template (e.g., "Signer1")
- `emailSubject` (string, optional): Override template subject
- `options` (object, optional):
  - `status` (string): "sent" or "created"
  - `accountId` (string): Specific DocuSign account ID

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  templateId: "12345678-1234-1234-1234-123456789012",
  recipients: [{
    email: "john.doe@company.com",
    name: "John Doe",
    roleName: "Signer"
  }],
  emailSubject: "Please sign: NDA Agreement"
}
```

---

### 5. list_templates

List available envelope templates for an account.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `options` (object, optional):
  - `accountId` (string): Specific DocuSign account ID
  - `count` (number): Max results (1-100, default: 20)
  - `searchText` (string): Search templates by name

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  options: {
    searchText: "employment",
    count: 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "templateId": "12345678-1234-1234-1234-123456789012",
        "name": "Employment Contract Template",
        "description": "Standard employment contract",
        "created": "2025-01-15T10:00:00Z"
      }
    ],
    "totalCount": 1
  }
}
```

---

### 6. download_document

Download a document or certificate from an envelope.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `envelopeId` (string, required): Envelope ID
- `documentId` (string, required): Document ID (use "combined" for all docs)
- `options` (object, optional):
  - `accountId` (string): Specific DocuSign account ID
  - `certificate` (boolean): Include certificate of completion (default: false)

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  envelopeId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  documentId: "1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentBase64": "JVBERi0xLjQKJeLjz9MK...",
    "documentName": "document_1.pdf",
    "mimeType": "application/pdf"
  }
}
```

---

### 7. void_envelope

Void (cancel) an envelope that has been sent but not completed.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `envelopeId` (string, required): Envelope ID to void
- `voidReason` (string, required): Reason for voiding
- `options` (object, optional):
  - `accountId` (string): Specific DocuSign account ID

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  envelopeId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  voidReason: "Contract terms changed"
}
```

---

### 8. get_recipient_status

Get detailed status information for all recipients.

**Parameters:**
- `accessToken` (string, required): OAuth 2.0 access token
- `envelopeId` (string, required): Envelope ID
- `options` (object, optional):
  - `accountId` (string): Specific DocuSign account ID

**Example:**
```typescript
{
  accessToken: "eyJ0eXAiOiJNVCIsImFsZ...",
  envelopeId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recipients": [
      {
        "recipientId": "1",
        "email": "john.doe@company.com",
        "name": "John Doe",
        "type": "signer",
        "status": "completed",
        "signedDateTime": "2025-11-01T14:25:00Z",
        "deliveredDateTime": "2025-11-01T12:05:00Z"
      }
    ],
    "totalRecipients": 1
  }
}
```

## Installation

```bash
cd "C:\Users\oreph\Documents\AgenticLedger\Custom MCP SERVERS\DocuSignMCP"
npm install
npm run build
```

## Testing

```bash
# Set your DocuSign access token
export DOCUSIGN_ACCESS_TOKEN="your_token_here"

# Run integration tests
npm run test:integration
```

## DocuSign Setup

### 1. Create Developer Account

1. Visit https://developers.docusign.com/
2. Click "Get Started for Free"
3. Create your developer account

### 2. Create Integration Key

1. Go to Admin > Integrations > Apps and Keys
2. Click "+ Add App and Integration Key"
3. Give it a name (e.g., "AgenticLedger MCP")
4. Save the Integration Key (Client ID)

### 3. Configure OAuth

1. Add Redirect URI: `https://your-platform.com/oauth/callback`
2. Add Secret Key (for Authorization Code Grant)
3. Request these scopes:
   - `signature` - For envelope operations
   - `impersonation` - For acting on behalf of users

### 4. Get Access Token

Use OAuth 2.0 Authorization Code Grant:

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

## Platform Integration Notes

### Authentication Flow

1. **Platform handles OAuth:** AgenticLedger platform manages the complete OAuth flow
2. **Token passed to server:** MCP server receives access token via `accessToken` parameter
3. **No token storage:** Server doesn't store tokens, receives them per request
4. **Token refresh:** Platform handles token refresh automatically

### Environment Support

- **Demo (Sandbox):** `https://demo.docusign.net/restapi`
- **Production:** `https://www.docusign.net/restapi`

The server automatically detects the environment from the access token.

### Rate Limits

DocuSign API rate limits:
- Demo: 1,000 requests per hour
- Production: Varies by plan (typically 1,000+/hour)

### Required Scopes

- `signature` - Send and manage envelopes
- `impersonation` - Act on behalf of authenticated user

## Error Handling

All tools return consistent error format:

```json
{
  "success": false,
  "error": "Specific error message explaining what went wrong"
}
```

**Common errors:**
- `Invalid or expired authentication credentials` - Token invalid/expired
- `Envelope not found with ID: xxx` - Invalid envelope ID
- `Template not found with ID: xxx` - Invalid template ID
- `One or more recipient email addresses are invalid` - Email validation failed

## Dependencies

- `@modelcontextprotocol/sdk` ^1.0.4 - MCP protocol implementation
- `docusign-esign` ^7.0.0 - Official DocuSign Node.js SDK
- `zod` ^3.24.1 - Schema validation
- `zod-to-json-schema` ^3.22.4 - Schema conversion

## Technical Specifications

- **Node.js version:** >=18.0.0
- **TypeScript:** ES2022 with strict mode
- **Module system:** ES Modules
- **Official SDK:** Yes (docusign-esign)
- **Authentication:** OAuth 2.0
- **Response format:** Standard AgenticLedger format

## Known Limitations

1. **Access token required:** All operations require valid access token
2. **Account auto-detection:** Uses default account from user info
3. **Document format:** Base64 encoding required for document upload
4. **Template roles:** Must match template configuration exactly

## Platform Configuration Recommendations

1. **Token lifetime:** Implement token refresh (DocuSign tokens expire in ~8 hours)
2. **Error handling:** Present clear messages to users for auth failures
3. **Demo vs Production:** Allow users to select environment
4. **Template management:** Provide UI for users to see available templates

## Use Cases

- **HR onboarding:** Automate employment contract signing
- **Sales contracts:** Send proposals for customer signature
- **NDAs:** Quick NDA distribution and tracking
- **Legal documents:** Manage legal agreement workflows
- **Invoice approval:** Get client approval on invoices

## Support & Resources

**DocuSign Developer Center:**
- https://developers.docusign.com/

**API Reference:**
- https://developers.docusign.com/docs/esign-rest-api/reference/

**OAuth Guide:**
- https://developers.docusign.com/platform/auth/

**Code Examples:**
- https://github.com/docusign/code-examples-node

---

**Built for AgenticLedger Platform**
**Following MCP Server Build Pattern v1.0.0**
**Repository:** TBD

---

**Status:** ✅ Code Complete - Awaiting Real API Testing
**Next Step:** Obtain DocuSign access token and run integration tests

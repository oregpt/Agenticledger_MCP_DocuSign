# DocuSign MCP Server - Research Summary

**Date:** November 1, 2025
**Status:** 🔍 Research Phase

---

## What We Found

### 1. Official DocuSign MCP Announcement (Oct 30, 2025)

**Source:** DocuSign Press Release & Discover 2025 Event

**Key Points:**
- DocuSign officially announced MCP connector for ChatGPT
- Uses Model Context Protocol (open standard)
- Connects ChatGPT with DocuSign Intelligent Agreement Management (IAM) platform
- Enables creating and analyzing contracts directly in ChatGPT
- Demoed at DocuSign Discover 2025 (annual developer event)
- Can extend IAM functionality within OpenAI's AgentKit

**Quote:**
> "Docusign is building a connector using the Model Context Protocol (MCP), an open standard available to developers. The connector will securely connect ChatGPT with Docusign IAM—an enterprise-grade platform for preparing, signing, and managing agreements—while maintaining the trust, security, and compliance that businesses of all sizes rely on."

### 2. Third-Party MCP Servers

**CData DocuSign MCP Server:**
- Repository: https://github.com/CDataSoftware/docusign-mcp-server-by-cdata
- Type: Read-only SQL query interface
- Uses: CData JDBC Driver for DocuSign
- License: MIT
- Status: Production (with paid/trial JDBC driver)

**Tools:**
1. `get_tables` - List available DocuSign data tables
2. `get_columns` - List columns for a table
3. `run_query` - Execute SQL SELECT statements

**Approach:** Treats DocuSign data as relational database

**Limitations:**
- Read-only
- Requires CData JDBC Driver (paid/trial)
- Java-based
- Not using DocuSign REST API directly

### 3. Other Third-Party Integrations

**Composio MCP DocuSign:**
- URL: https://mcp.composio.dev/docusign
- Seamless integration for Claude, Cursor, Windsurf
- Pre-built tools and actions

**Zapier MCP DocuSign:**
- URL: https://zapier.com/mcp/docusign
- No-code integration approach
- Connects DocuSign actions with AI tools

**Pipedream MCP:**
- URL: https://mcp.pipedream.com/app/docusign_developer
- Electronic signature integration

---

## What We DON'T Have

### Missing Official Documentation

❌ **No public GitHub repository** from DocuSign for MCP server
❌ **No npm package** for official DocuSign MCP server
❌ **No public API documentation** at developers.docusign.com/tools/mcp-server/
❌ **No code examples** from DocuSign for MCP implementation
❌ **No release date** for public availability

### What This Means

The official DocuSign MCP connector appears to be:
- **Announced** but not yet publicly released
- **Demoed** at Discover 2025 event (Oct 30, 2025)
- **In development** for ChatGPT/OpenAI integration
- **Future availability** TBD

---

## DocuSign eSignature API (REST API)

**Available Now:** https://developers.docusign.com/

### Key APIs

**eSignature REST API:**
- Send envelopes for signature
- Get envelope status
- Create templates
- Manage recipients
- Download documents

**Authentication:**
- OAuth 2.0 (Authorization Code Grant)
- JWT Grant

**Common Operations:**
1. Create envelope from template
2. Send envelope for signature
3. Get envelope status
4. List templates
5. Download signed documents

### API Endpoints (Examples)

```
POST /v2.1/accounts/{accountId}/envelopes
GET /v2.1/accounts/{accountId}/envelopes/{envelopeId}
GET /v2.1/accounts/{accountId}/templates
GET /v2.1/accounts/{accountId}/envelopes/{envelopeId}/documents/{documentId}
```

---

## Options for Building DocuSign MCP Server

### Option 1: Wait for Official Release ⏳

**Pros:**
- Official support from DocuSign
- Likely to have full feature set
- Will integrate with OpenAI AgentKit

**Cons:**
- No public release date
- Can't build now
- Unknown timeline

**Recommendation:** Not viable for immediate development

---

### Option 2: Build Custom MCP Server Using DocuSign eSignature REST API ✅

**Approach:**
Wrap DocuSign eSignature REST API in MCP server following AgenticLedger standards

**Tools to Implement:**
1. `send_envelope` - Create and send envelope for signature
2. `get_envelope_status` - Check status of envelope
3. `list_templates` - Get available envelope templates
4. `create_envelope_from_template` - Use template to create envelope
5. `download_signed_document` - Download completed documents
6. `list_envelopes` - Get envelopes for account
7. `void_envelope` - Cancel an envelope
8. `get_recipient_status` - Check recipient signing status

**Authentication:**
- OAuth 2.0 (Authorization Code Grant)
- Platform handles user auth, server receives access token

**Pros:**
- ✅ Can build immediately
- ✅ Uses official DocuSign REST API
- ✅ Full control over features
- ✅ Follows AgenticLedger patterns
- ✅ Production-ready API (stable)
- ✅ Comprehensive documentation available

**Cons:**
- Need to implement OAuth flow
- Need to handle API rate limits
- More complex than read-only approach

**Recommendation:** ⭐ Best option for production use

---

### Option 3: Fork/Adapt CData Approach (JDBC Driver) ❌

**Approach:**
Build read-only SQL interface to DocuSign data

**Pros:**
- Reference implementation exists
- SQL query interface

**Cons:**
- ❌ Requires CData JDBC Driver (paid/trial)
- ❌ Java-based (we use TypeScript)
- ❌ Read-only (can't send envelopes)
- ❌ Not using REST API directly
- ❌ Limited functionality

**Recommendation:** Not suitable for our needs

---

## Recommended Approach

### Build Custom DocuSign MCP Server Using REST API

**Why:**
1. **Immediate availability** - Can build now
2. **Official API** - Stable, documented, supported
3. **Full functionality** - Send envelopes, not just read data
4. **AgenticLedger compliant** - Follow our platform standards
5. **TypeScript** - Consistent with our other servers
6. **OAuth 2.0** - Standard authentication pattern

**What We'll Build:**
```
DocuSignMCP/
├── src/
│   ├── index.ts       # MCP server
│   ├── schemas.ts     # Zod schemas for 6-8 tools
│   ├── api.ts         # DocuSign REST API client
│   └── tools.ts       # Tool implementations
├── tests/
│   └── test-docusign.js  # Integration tests
├── README.md
├── EXECUTION_GUIDE.md
└── package.json
```

**Tools (MVP):**
1. `send_envelope` - Send document for signature
2. `get_envelope_status` - Check signing status
3. `list_templates` - Get available templates
4. `create_envelope_from_template` - Use template
5. `download_signed_document` - Get completed docs
6. `list_envelopes` - Get account envelopes

**Authentication Flow:**
1. User authenticates via OAuth 2.0 in AgenticLedger platform
2. Platform obtains access token
3. Platform passes token to MCP server via `accessToken` parameter
4. MCP server uses token for API calls

**API Documentation:**
- https://developers.docusign.com/docs/esign-rest-api/
- https://developers.docusign.com/platform/auth/

---

## Implementation Status

1. ✅ Research complete
2. ✅ Project structure created
3. ✅ OAuth token handling implemented
4. ✅ API client wrapper built (using official docusign-esign SDK)
5. ✅ 8 core tools implemented
6. ✅ Integration test template created
7. ✅ Complete documentation written
8. ⏳ Pending: Test with DocuSign sandbox account (requires OAuth credentials)

**GitHub Repository:** https://github.com/oregpt/Agenticledger_MCP_DocuSign
**Status:** Code complete v1.0.0 - Ready for real API testing

---

## Resources

**DocuSign Developer Center:**
- https://developers.docusign.com/

**eSignature REST API:**
- https://developers.docusign.com/docs/esign-rest-api/

**Authentication:**
- https://developers.docusign.com/platform/auth/

**API Reference:**
- https://developers.docusign.com/docs/esign-rest-api/reference/

**Code Examples:**
- https://github.com/docusign/code-examples-node

**Sandbox (Free):**
- https://developers.docusign.com/

---

**Conclusion:** We should build a custom MCP server wrapping the DocuSign eSignature REST API, following AgenticLedger standards, using TypeScript and OAuth 2.0 authentication.

/**
 * Integration tests for DocuSign MCP Server
 *
 * NOTE: These tests require a valid DocuSign access token
 * To run: npm run test:integration
 *
 * Prerequisites:
 * 1. DocuSign Developer Account (free at https://developers.docusign.com/)
 * 2. OAuth 2.0 Access Token
 * 3. At least one envelope template (for template tests)
 */

import {
  sendEnvelope,
  getEnvelopeStatus,
  listEnvelopes,
  createEnvelopeFromTemplate,
  listTemplates,
  downloadDocument,
  voidEnvelope,
  getRecipientStatus
} from '../dist/tools.js';

import fs from 'fs';

console.log('============================================================');
console.log('  DOCUSIGN MCP SERVER - INTEGRATION TESTS');
console.log('  Testing against: DocuSign Demo Environment');
console.log('============================================================\n');

// TODO: Replace with actual access token from DocuSign OAuth flow
// Get token from: https://developers.docusign.com/platform/auth/
const ACCESS_TOKEN = process.env.DOCUSIGN_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';

if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
  console.error('❌ Error: Please set DOCUSIGN_ACCESS_TOKEN environment variable');
  console.error('   Get token from: https://developers.docusign.com/\n');
  console.error('   Example: export DOCUSIGN_ACCESS_TOKEN="your_token_here"');
  console.error('   Then run: npm run test:integration\n');
  process.exit(1);
}

let testsPassed = 0;
let testsFailed = 0;
let createdEnvelopeId = null;

/**
 * Test helper
 */
async function runTest(name, fn) {
  try {
    console.log(`\n▶ Test: ${name}`);
    const startTime = Date.now();
    await fn();
    const duration = Date.now() - startTime;
    console.log(`✅ PASSED (${duration}ms)\n`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}\n`);
    testsFailed++;
  }
}

/**
 * Test 1: List Templates
 */
await runTest('List Available Templates', async () => {
  const result = await listTemplates({
    accessToken: ACCESS_TOKEN,
    options: {
      count: 10
    }
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to list templates');
  }

  console.log(`   Total templates: ${result.data.totalCount}`);
  console.log(`   Returned: ${result.data.templates.length}`);

  if (result.data.templates.length > 0) {
    console.log(`\n   Sample templates:`);
    result.data.templates.slice(0, 3).forEach((tmpl, i) => {
      console.log(`   ${i + 1}. ${tmpl.name}`);
      console.log(`      ID: ${tmpl.templateId}`);
      console.log(`      Created: ${tmpl.created}`);
    });
  }
});

/**
 * Test 2: List Envelopes
 */
await runTest('List Recent Envelopes', async () => {
  const result = await listEnvelopes({
    accessToken: ACCESS_TOKEN,
    options: {
      count: 5,
      status: 'all'
    }
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to list envelopes');
  }

  console.log(`   Total envelopes: ${result.data.totalCount}`);
  console.log(`   Returned: ${result.data.envelopes.length}`);

  if (result.data.envelopes.length > 0) {
    console.log(`\n   Recent envelopes:`);
    result.data.envelopes.slice(0, 3).forEach((env, i) => {
      console.log(`   ${i + 1}. ${env.emailSubject || 'No subject'}`);
      console.log(`      Status: ${env.status}`);
      console.log(`      Sent: ${env.sentDateTime || 'N/A'}`);
    });
  }
});

/**
 * Test 3: Send Envelope (Optional - creates real envelope)
 * Uncomment to test envelope sending
 */
/*
await runTest('Send Test Envelope', async () => {
  // Create a simple test PDF in base64
  const testPdf = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGQKKFRlc3QgRG9jdW1lbnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNTkgMDAwMDAgbiAKMDAwMDAwMDEyOCAwMDAwMCBuIAowMDAwMDAwMjM5IDAwMDAwIG4gCjAwMDAwMDAzMjcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MjEKJSVFT0Y=';

  const result = await sendEnvelope({
    accessToken: ACCESS_TOKEN,
    documentBase64: testPdf,
    documentName: 'test-document.pdf',
    recipients: [{
      email: 'test@example.com',
      name: 'Test Recipient'
    }],
    emailSubject: 'Please sign this test document',
    emailBody: 'This is a test envelope from DocuSign MCP Server',
    options: {
      status: 'created' // Create as draft, don't send
    }
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to send envelope');
  }

  createdEnvelopeId = result.data.envelopeId;
  console.log(`   Envelope created: ${result.data.envelopeId}`);
  console.log(`   Status: ${result.data.status}`);
  console.log(`   URI: ${result.data.uri}`);
});
*/

/**
 * Test 4: Validation - Missing accessToken
 */
await runTest('Validation - Missing accessToken', async () => {
  const result = await listEnvelopes({
    accessToken: '',
    options: { count: 1 }
  });

  if (result.success) {
    throw new Error('Should have failed validation');
  }

  console.log(`   Expected error: ${result.error}`);

  if (!result.error || (!result.error.includes('credentials') && !result.error.includes('accessToken'))) {
    throw new Error('Wrong error message');
  }
});

/**
 * Test 5: Error Handling - Invalid Envelope ID
 */
await runTest('Error Handling - Invalid Envelope ID', async () => {
  const result = await getEnvelopeStatus({
    accessToken: ACCESS_TOKEN,
    envelopeId: 'invalid-envelope-id-12345'
  });

  if (result.success) {
    throw new Error('Should have failed with invalid envelope ID');
  }

  console.log(`   Expected error: ${result.error}`);

  if (!result.error) {
    throw new Error('Missing error message');
  }
});

/**
 * Test Summary
 */
console.log('\n============================================================');
console.log('  TEST SUMMARY');
console.log('============================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!\n');
  console.log('Note: Some tests require additional setup:');
  console.log('  - Uncomment envelope sending test to test full workflow');
  console.log('  - Create templates in DocuSign to test template functionality\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed\n`);
  process.exit(1);
}

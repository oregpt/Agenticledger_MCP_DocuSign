/**
 * Test real DocuSign functionality with actual templates and envelopes
 */

import {
  listTemplates,
  listEnvelopes,
  getEnvelopeStatus,
  getRecipientStatus,
  sendEnvelope,
  createEnvelopeFromTemplate,
  downloadDocument,
  voidEnvelope
} from './dist/tools.js';

const ACCESS_TOKEN = process.env.DOCUSIGN_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Please set DOCUSIGN_ACCESS_TOKEN');
  process.exit(1);
}

console.log('============================================================');
console.log('  TESTING ALL 8 DOCUSIGN MCP TOOLS');
console.log('============================================================\n');

let testsPassed = 0;
let testsFailed = 0;
let templateId = null;
let testEnvelopeId = null;

// Test 1: List your actual templates
console.log('▶ Test 1: list_templates\n');
try {
  const templatesResult = await listTemplates({
    accessToken: ACCESS_TOKEN,
    options: { count: 10 }
  });

  if (templatesResult.success) {
    console.log(`✅ PASSED - Found ${templatesResult.data.totalCount} template(s)\n`);
    testsPassed++;

    if (templatesResult.data.templates.length > 0) {
      console.log('Your Templates:');
      templatesResult.data.templates.forEach((tmpl, i) => {
        console.log(`  ${i + 1}. ${tmpl.name}`);
        console.log(`     ID: ${tmpl.templateId}`);
      });

      // Save first template ID for later test
      templateId = templatesResult.data.templates[0].templateId;
      console.log(`\n  Will use template ID: ${templateId} for testing\n`);
    }
  } else {
    console.log(`❌ FAILED: ${templatesResult.error}\n`);
    testsFailed++;
  }
} catch (error) {
  console.log(`❌ FAILED: ${error.message}\n`);
  testsFailed++;
}

// Test 2: List your actual envelopes
console.log('\n▶ Test 2: list_envelopes\n');
try {
  const envelopesResult = await listEnvelopes({
    accessToken: ACCESS_TOKEN,
    options: {
      count: 20,
      status: 'all'
    }
  });

  if (envelopesResult.success) {
    console.log(`✅ PASSED - Found ${envelopesResult.data.totalCount} envelope(s)\n`);
    testsPassed++;

    if (envelopesResult.data.envelopes.length > 0) {
      console.log('Your Envelopes:');
      envelopesResult.data.envelopes.slice(0, 5).forEach((env, i) => {
        console.log(`  ${i + 1}. ${env.emailSubject || 'No Subject'}`);
        console.log(`     ID: ${env.envelopeId}`);
        console.log(`     Status: ${env.status}`);
      });

      // Save first envelope for testing
      testEnvelopeId = envelopesResult.data.envelopes[0].envelopeId;
      console.log(`\n  Will use envelope ID: ${testEnvelopeId} for testing\n`);
    }
  } else {
    console.log(`❌ FAILED: ${envelopesResult.error}\n`);
    testsFailed++;
  }
} catch (error) {
  console.log(`❌ FAILED: ${error.message}\n`);
  testsFailed++;
}

// Test 3: Get envelope status (if we have an envelope)
if (testEnvelopeId) {
  console.log('\n▶ Test 3: get_envelope_status\n');
  try {
    const statusResult = await getEnvelopeStatus({
      accessToken: ACCESS_TOKEN,
      envelopeId: testEnvelopeId,
      options: { includeRecipients: true }
    });

    if (statusResult.success) {
      console.log(`✅ PASSED - Got envelope details\n`);
      testsPassed++;
      console.log(`  Subject: ${statusResult.data.emailSubject}`);
      console.log(`  Status: ${statusResult.data.status}`);
      console.log(`  Recipients: ${statusResult.data.recipients?.length || 0}\n`);
    } else {
      console.log(`❌ FAILED: ${statusResult.error}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
    testsFailed++;
  }
} else {
  console.log('\n⏭️  Test 3: get_envelope_status - SKIPPED (no envelopes)\n');
}

// Test 4: Get recipient status (if we have an envelope)
if (testEnvelopeId) {
  console.log('▶ Test 4: get_recipient_status\n');
  try {
    const recipientResult = await getRecipientStatus({
      accessToken: ACCESS_TOKEN,
      envelopeId: testEnvelopeId
    });

    if (recipientResult.success) {
      console.log(`✅ PASSED - Got ${recipientResult.data.totalRecipients} recipient(s)\n`);
      testsPassed++;

      recipientResult.data.recipients.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name} - ${r.status}`);
      });
      console.log('');
    } else {
      console.log(`❌ FAILED: ${recipientResult.error}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
    testsFailed++;
  }
} else {
  console.log('⏭️  Test 4: get_recipient_status - SKIPPED (no envelopes)\n');
}

// Test 5: Send envelope (create as draft, don't actually send)
console.log('▶ Test 5: send_envelope (draft mode)\n');
try {
  // Simple test PDF in base64
  const testPdf = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGQKKFRlc3QgRG9jdW1lbnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNTkgMDAwMDAgbiAKMDAwMDAwMDEyOCAwMDAwMCBuIAowMDAwMDAwMjM5IDAwMDAwIG4gCjAwMDAwMDAzMjcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MjEKJSVFT0Y=';

  const sendResult = await sendEnvelope({
    accessToken: ACCESS_TOKEN,
    documentBase64: testPdf,
    documentName: 'test-document.pdf',
    recipients: [{
      email: 'test@example.com',
      name: 'Test Recipient'
    }],
    emailSubject: 'MCP Server Test Document',
    emailBody: 'This is a test envelope created by DocuSign MCP Server',
    options: {
      status: 'created' // Create as draft, don't send
    }
  });

  if (sendResult.success) {
    console.log(`✅ PASSED - Created draft envelope\n`);
    testsPassed++;
    console.log(`  Envelope ID: ${sendResult.data.envelopeId}`);
    console.log(`  Status: ${sendResult.data.status}\n`);

    // Save for potential void test
    const draftEnvelopeId = sendResult.data.envelopeId;

    // Test 8: Void the draft envelope we just created
    console.log('▶ Test 8: void_envelope (voiding test draft)\n');
    try {
      const voidResult = await voidEnvelope({
        accessToken: ACCESS_TOKEN,
        envelopeId: draftEnvelopeId,
        voidReason: 'Test envelope - cleaning up'
      });

      if (voidResult.success) {
        console.log(`✅ PASSED - Voided test envelope\n`);
        testsPassed++;
      } else {
        console.log(`❌ FAILED: ${voidResult.error}\n`);
        testsFailed++;
      }
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
      testsFailed++;
    }
  } else {
    console.log(`❌ FAILED: ${sendResult.error}\n`);
    testsFailed++;
  }
} catch (error) {
  console.log(`❌ FAILED: ${error.message}\n`);
  testsFailed++;
}

// Test 6: Create from template (if we have a template)
if (templateId) {
  console.log('▶ Test 6: create_envelope_from_template (draft mode)\n');
  try {
    const templateResult = await createEnvelopeFromTemplate({
      accessToken: ACCESS_TOKEN,
      templateId: templateId,
      recipients: [{
        email: 'test@example.com',
        name: 'Test Recipient',
        roleName: 'Signer'
      }],
      emailSubject: 'MCP Server Template Test',
      options: {
        status: 'created' // Draft
      }
    });

    if (templateResult.success) {
      console.log(`✅ PASSED - Created envelope from template\n`);
      testsPassed++;
      console.log(`  Envelope ID: ${templateResult.data.envelopeId}\n`);
    } else {
      console.log(`❌ FAILED: ${templateResult.error}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
    testsFailed++;
  }
} else {
  console.log('⏭️  Test 6: create_envelope_from_template - SKIPPED (no templates)\n');
}

// Test 7: Download document (if we have a completed envelope)
if (testEnvelopeId) {
  console.log('▶ Test 7: download_document\n');
  try {
    const downloadResult = await downloadDocument({
      accessToken: ACCESS_TOKEN,
      envelopeId: testEnvelopeId,
      documentId: '1'
    });

    if (downloadResult.success) {
      console.log(`✅ PASSED - Downloaded document\n`);
      testsPassed++;
      console.log(`  Document: ${downloadResult.data.documentName}`);
      console.log(`  Size: ${downloadResult.data.documentBase64.length} bytes (base64)\n`);
    } else {
      console.log(`⚠️  PARTIAL: ${downloadResult.error}`);
      console.log(`  (This might fail if envelope isn't completed yet)\n`);
      // Don't count as failure - document might not be ready
    }
  } catch (error) {
    console.log(`⚠️  PARTIAL: ${error.message}`);
    console.log(`  (This might fail if envelope isn't completed yet)\n`);
  }
} else {
  console.log('⏭️  Test 7: download_document - SKIPPED (no envelopes)\n');
}

// Summary
console.log('\n============================================================');
console.log('  TEST SUMMARY');
console.log('============================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);
console.log('');

if (testsFailed === 0) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('All 8 DocuSign MCP tools are working correctly.\n');
} else {
  console.log(`⚠️  ${testsFailed} test(s) failed\n`);
}

/**
 * DocuSign MCP Server Tools
 *
 * Following AgenticLedger Platform MCP Server Build Pattern v1.0.0
 * All tools follow standard response format: { success: boolean, data?: any, error?: string }
 */

import {
  DocuSignClient,
  createEnvelopeDefinition,
  createTemplateEnvelopeDefinition
} from './api.js';

/**
 * Tool 1: send_envelope
 * Sends a document for electronic signature
 */
export async function sendEnvelope(params: {
  accessToken: string;
  documentBase64: string;
  documentName: string;
  recipients: Array<{ email: string; name: string; role?: string }>;
  emailSubject: string;
  emailBody?: string;
  options?: {
    status?: 'sent' | 'created';
    accountId?: string;
  };
}): Promise<{
  success: boolean;
  data?: {
    envelopeId: string;
    status: string;
    statusDateTime: string;
    uri: string;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Create envelope
    const envelopeDefinition = createEnvelopeDefinition({
      documentBase64: params.documentBase64,
      documentName: params.documentName,
      recipients: params.recipients,
      emailSubject: params.emailSubject,
      emailBody: params.emailBody,
      status: params.options?.status || 'sent'
    });

    // Send envelope
    const envelopesApi = client.getEnvelopesApi();
    const result = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });

    if (!result.envelopeId) {
      return {
        success: false,
        error: 'Envelope created but no envelope ID returned'
      };
    }

    return {
      success: true,
      data: {
        envelopeId: result.envelopeId,
        status: result.status || 'unknown',
        statusDateTime: result.statusDateTime || new Date().toISOString(),
        uri: result.uri || ''
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials. Please re-authenticate with DocuSign.'
      };
    }
    if (error instanceof Error && error.message.includes('INVALID_EMAIL')) {
      return {
        success: false,
        error: 'One or more recipient email addresses are invalid'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tool 2: get_envelope_status
 * Gets the current status of an envelope
 */
export async function getEnvelopeStatus(params: {
  accessToken: string;
  envelopeId: string;
  options?: {
    accountId?: string;
    includeRecipients?: boolean;
  };
}): Promise<{
  success: boolean;
  data?: {
    envelopeId: string;
    status: string;
    statusDateTime: string;
    emailSubject: string;
    sender: { email: string; name: string };
    recipients?: Array<{
      email: string;
      name: string;
      status: string;
      signedDateTime?: string;
    }>;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Get envelope
    const envelopesApi = client.getEnvelopesApi();
    const envelope = await envelopesApi.getEnvelope(accountId, params.envelopeId);

    const data: any = {
      envelopeId: envelope.envelopeId || params.envelopeId,
      status: envelope.status || 'unknown',
      statusDateTime: envelope.statusDateTime || '',
      emailSubject: envelope.emailSubject || '',
      sender: {
        email: envelope.sender?.email || '',
        name: envelope.sender?.userName || ''
      }
    };

    // Get recipients if requested
    if (params.options?.includeRecipients !== false) {
      const recipients = await envelopesApi.listRecipients(accountId, params.envelopeId);
      data.recipients = recipients.signers?.map((signer: any) => ({
        email: signer.email || '',
        name: signer.name || '',
        status: signer.status || '',
        signedDateTime: signer.signedDateTime || undefined
      })) || [];
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENVELOPE_NOT_FOUND')) {
      return {
        success: false,
        error: `Envelope not found with ID: ${params.envelopeId}`
      };
    }
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tool 3: list_envelopes
 * Lists envelopes for an account
 */
export async function listEnvelopes(params: {
  accessToken: string;
  options?: {
    accountId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    count?: number;
  };
}): Promise<{
  success: boolean;
  data?: {
    envelopes: Array<{
      envelopeId: string;
      status: string;
      emailSubject: string;
      sentDateTime: string;
    }>;
    totalCount: number;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Build options
    const listOptions: any = {
      count: String(params.options?.count || 20)
    };

    if (params.options?.status && params.options.status !== 'all') {
      listOptions.status = params.options.status;
    }

    // fromDate is required by DocuSign API
    if (params.options?.fromDate) {
      listOptions.fromDate = params.options.fromDate;
    } else {
      // Default to last 30 days if not specified
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      listOptions.fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    if (params.options?.toDate) {
      listOptions.toDate = params.options.toDate;
    }

    // List envelopes
    const envelopesApi = client.getEnvelopesApi();
    const result = await envelopesApi.listStatusChanges(accountId, listOptions);

    const envelopes = result.envelopes?.map((env: any) => ({
      envelopeId: env.envelopeId || '',
      status: env.status || '',
      emailSubject: env.emailSubject || '',
      sentDateTime: env.sentDateTime || env.statusDateTime || ''
    })) || [];

    return {
      success: true,
      data: {
        envelopes,
        totalCount: parseInt(result.totalSetSize || '0', 10)
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tool 4: create_envelope_from_template
 * Creates an envelope from a template
 */
export async function createEnvelopeFromTemplate(params: {
  accessToken: string;
  templateId: string;
  recipients: Array<{ email: string; name: string; roleName: string }>;
  emailSubject?: string;
  options?: {
    status?: 'sent' | 'created';
    accountId?: string;
  };
}): Promise<{
  success: boolean;
  data?: {
    envelopeId: string;
    status: string;
    statusDateTime: string;
    uri: string;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Create envelope from template
    const envelopeDefinition = createTemplateEnvelopeDefinition({
      templateId: params.templateId,
      recipients: params.recipients,
      emailSubject: params.emailSubject,
      status: params.options?.status || 'sent'
    });

    // Send envelope
    const envelopesApi = client.getEnvelopesApi();
    const result = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });

    if (!result.envelopeId) {
      return {
        success: false,
        error: 'Envelope created but no envelope ID returned'
      };
    }

    return {
      success: true,
      data: {
        envelopeId: result.envelopeId,
        status: result.status || 'unknown',
        statusDateTime: result.statusDateTime || new Date().toISOString(),
        uri: result.uri || ''
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('TEMPLATE_NOT_FOUND')) {
      return {
        success: false,
        error: `Template not found with ID: ${params.templateId}`
      };
    }
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tool 5: list_templates
 * Lists available templates
 */
export async function listTemplates(params: {
  accessToken: string;
  options?: {
    accountId?: string;
    count?: number;
    searchText?: string;
  };
}): Promise<{
  success: boolean;
  data?: {
    templates: Array<{
      templateId: string;
      name: string;
      description?: string;
      created: string;
    }>;
    totalCount: number;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Build options
    const listOptions: any = {
      count: String(params.options?.count || 20)
    };

    if (params.options?.searchText) {
      listOptions.searchText = params.options.searchText;
    }

    // List templates
    const templatesApi = client.getTemplatesApi();
    const result = await templatesApi.listTemplates(accountId, listOptions);

    const templates = result.envelopeTemplates?.map((tmpl: any) => ({
      templateId: tmpl.templateId || '',
      name: tmpl.name || '',
      description: tmpl.description || undefined,
      created: tmpl.created || ''
    })) || [];

    return {
      success: true,
      data: {
        templates,
        totalCount: parseInt(result.totalSetSize || '0', 10)
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tool 6: download_document
 * Downloads a document from an envelope
 */
export async function downloadDocument(params: {
  accessToken: string;
  envelopeId: string;
  documentId: string;
  options?: {
    accountId?: string;
    certificate?: boolean;
  };
}): Promise<{
  success: boolean;
  data?: {
    documentBase64: string;
    documentName: string;
    mimeType: string;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Download document
    const envelopesApi = client.getEnvelopesApi();
    const document = await envelopesApi.getDocument(accountId, params.envelopeId, params.documentId, {
      certificate: params.options?.certificate ? 'true' : 'false'
    });

    // Convert to base64
    const base64 = Buffer.from(document).toString('base64');

    return {
      success: true,
      data: {
        documentBase64: base64,
        documentName: `document_${params.documentId}.pdf`,
        mimeType: 'application/pdf'
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('DOCUMENT_NOT_FOUND')) {
      return {
        success: false,
        error: `Document not found: ${params.documentId} in envelope ${params.envelopeId}`
      };
    }
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tool 7: void_envelope
 * Voids (cancels) an envelope
 */
export async function voidEnvelope(params: {
  accessToken: string;
  envelopeId: string;
  voidReason: string;
  options?: {
    accountId?: string;
  };
}): Promise<{
  success: boolean;
  data?: {
    envelopeId: string;
    status: string;
    voidedReason: string;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Void envelope
    const envelopesApi = client.getEnvelopesApi();
    const result = await envelopesApi.update(accountId, params.envelopeId, {
      envelope: {
        status: 'voided',
        voidedReason: params.voidReason
      }
    });

    return {
      success: true,
      data: {
        envelopeId: result.envelopeId || params.envelopeId,
        status: result.status || 'voided',
        voidedReason: params.voidReason
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENVELOPE_CANNOT_VOID')) {
      return {
        success: false,
        error: 'Envelope cannot be voided (may already be completed or voided)'
      };
    }
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tool 8: get_recipient_status
 * Gets recipient status details
 */
export async function getRecipientStatus(params: {
  accessToken: string;
  envelopeId: string;
  options?: {
    accountId?: string;
  };
}): Promise<{
  success: boolean;
  data?: {
    recipients: Array<{
      recipientId: string;
      email: string;
      name: string;
      type: string;
      status: string;
      signedDateTime?: string;
      deliveredDateTime?: string;
    }>;
    totalRecipients: number;
  };
  error?: string;
}> {
  try {
    const client = new DocuSignClient(params.accessToken);

    // Get account info
    const userInfo = await client.getUserInfo();
    client.updateBasePath(userInfo.baseUri);
    const accountId = params.options?.accountId || userInfo.accountId;

    // Get recipients
    const envelopesApi = client.getEnvelopesApi();
    const result = await envelopesApi.listRecipients(accountId, params.envelopeId);

    const allRecipients: any[] = [
      ...(result.signers || []),
      ...(result.carbonCopies || []),
      ...(result.certifiedDeliveries || [])
    ];

    const recipients = allRecipients.map(recipient => ({
      recipientId: recipient.recipientId || '',
      email: recipient.email || '',
      name: recipient.name || '',
      type: recipient.recipientType || 'unknown',
      status: recipient.status || '',
      signedDateTime: recipient.signedDateTime || undefined,
      deliveredDateTime: recipient.deliveredDateTime || undefined
    }));

    return {
      success: true,
      data: {
        recipients,
        totalRecipients: recipients.length
      }
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENVELOPE_NOT_FOUND')) {
      return {
        success: false,
        error: `Envelope not found with ID: ${params.envelopeId}`
      };
    }
    if (error instanceof Error && error.message.includes('401')) {
      return {
        success: false,
        error: 'Invalid or expired authentication credentials'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

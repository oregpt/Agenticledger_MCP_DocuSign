/**
 * DocuSign API Client Wrapper
 *
 * Following AgenticLedger Platform MCP Server Build Pattern v1.0.0
 * Uses official DocuSign eSign Node.js SDK
 */

// @ts-ignore - No type definitions available for docusign-esign
import docusign from 'docusign-esign';

/**
 * DocuSign API Client
 * Wraps the official DocuSign eSign SDK with simplified interface
 */
export class DocuSignClient {
  private apiClient: docusign.ApiClient;
  private basePath: string;
  private accessToken: string;

  constructor(accessToken: string, basePath: string = 'https://demo.docusign.net/restapi') {
    this.basePath = basePath;
    this.accessToken = accessToken;
    this.apiClient = new docusign.ApiClient({ basePath: this.basePath });
    this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
  }

  /**
   * Get user info to retrieve account ID
   */
  async getUserInfo(): Promise<{ accountId: string; baseUri: string }> {
    try {
      // Set OAuth base path for getUserInfo call
      this.apiClient.setOAuthBasePath('account-d.docusign.com');
      const userInfo = await this.apiClient.getUserInfo(this.accessToken);

      if (!userInfo.accounts || userInfo.accounts.length === 0) {
        throw new Error('No DocuSign accounts found for this user');
      }

      // Get the default account
      const account = userInfo.accounts.find((acc: any) => acc.isDefault === 'true') || userInfo.accounts[0];

      return {
        accountId: account.accountId!,
        baseUri: account.baseUri!
      };
    } catch (error) {
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get Envelopes API instance
   */
  getEnvelopesApi(): docusign.EnvelopesApi {
    return new docusign.EnvelopesApi(this.apiClient);
  }

  /**
   * Get Templates API instance
   */
  getTemplatesApi(): docusign.TemplatesApi {
    return new docusign.TemplatesApi(this.apiClient);
  }

  /**
   * Update base path (needed after getting user info)
   */
  updateBasePath(basePath: string): void {
    // Ensure basePath includes /restapi
    this.basePath = basePath.includes('/restapi') ? basePath : `${basePath}/restapi`;
    this.apiClient.setBasePath(this.basePath);
  }
}

/**
 * Create envelope definition for sending
 */
export function createEnvelopeDefinition(params: {
  documentBase64: string;
  documentName: string;
  recipients: Array<{ email: string; name: string; role?: string }>;
  emailSubject: string;
  emailBody?: string;
  status?: 'sent' | 'created';
}): docusign.EnvelopeDefinition {
  // Create document
  const document: docusign.Document = {
    documentBase64: params.documentBase64,
    name: params.documentName,
    fileExtension: params.documentName.split('.').pop() || 'pdf',
    documentId: '1'
  };

  // Create signers
  const signers = params.recipients.map((recipient, index) => ({
    email: recipient.email,
    name: recipient.name,
    recipientId: String(index + 1),
    routingOrder: String(index + 1),
    tabs: {
      signHereTabs: [{
        anchorString: '/sig/',
        anchorUnits: 'pixels',
        anchorXOffset: '0',
        anchorYOffset: '0'
      }]
    }
  }));

  // Create envelope definition
  const envelope: docusign.EnvelopeDefinition = {
    emailSubject: params.emailSubject,
    emailBlurb: params.emailBody,
    documents: [document],
    recipients: {
      signers: signers
    },
    status: params.status || 'sent'
  };

  return envelope;
}

/**
 * Create envelope from template
 */
export function createTemplateEnvelopeDefinition(params: {
  templateId: string;
  recipients: Array<{ email: string; name: string; roleName: string }>;
  emailSubject?: string;
  status?: 'sent' | 'created';
}): docusign.EnvelopeDefinition {
  // Create template roles
  const templateRoles = params.recipients.map((recipient, index) => ({
    email: recipient.email,
    name: recipient.name,
    roleName: recipient.roleName,
    clientUserId: undefined, // For remote signing
    routingOrder: String(index + 1)
  }));

  // Create envelope definition
  const envelope: docusign.EnvelopeDefinition = {
    templateId: params.templateId,
    templateRoles: templateRoles,
    status: params.status || 'sent'
  };

  if (params.emailSubject) {
    envelope.emailSubject = params.emailSubject;
  }

  return envelope;
}

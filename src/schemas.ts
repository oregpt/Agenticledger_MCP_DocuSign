/**
 * Zod Schemas for DocuSign MCP Server
 *
 * Following AgenticLedger Platform MCP Server Build Pattern v1.0.0
 * All parameters use .describe() for clear documentation
 */

import { z } from 'zod';

/**
 * Schema for send_envelope tool
 * Sends a document for electronic signature
 */
export const SendEnvelopeSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  documentBase64: z.string().describe('Base64-encoded document content (PDF, DOCX, etc.)'),
  documentName: z.string().describe('Name of the document (e.g., "Contract.pdf")'),
  recipients: z.array(z.object({
    email: z.string().email().describe('Email address of the recipient'),
    name: z.string().describe('Full name of the recipient'),
    role: z.enum(['signer', 'carbon_copy', 'certified_delivery']).optional().describe('Recipient role (default: signer)')
  })).describe('List of recipients who will receive the document'),
  emailSubject: z.string().describe('Subject line for the signing request email'),
  emailBody: z.string().optional().describe('Custom message in the signing request email (optional)'),
  options: z.object({
    status: z.enum(['sent', 'created']).optional().describe('Envelope status: "sent" (immediate) or "created" (draft) - default: sent'),
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)')
  }).optional().describe('Optional configuration for envelope sending')
}).describe('Send a document for electronic signature via DocuSign');

/**
 * Schema for get_envelope_status tool
 * Gets the status of a sent envelope
 */
export const GetEnvelopeStatusSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  envelopeId: z.string().describe('Unique identifier of the envelope to check'),
  options: z.object({
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)'),
    includeRecipients: z.boolean().optional().describe('Include recipient details in response (default: true)')
  }).optional().describe('Optional configuration for status retrieval')
}).describe('Get the current status and details of a DocuSign envelope');

/**
 * Schema for list_envelopes tool
 * Lists envelopes for an account with filtering
 */
export const ListEnvelopesSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  options: z.object({
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)'),
    status: z.enum(['sent', 'delivered', 'completed', 'declined', 'voided', 'all']).optional().describe('Filter by envelope status (default: all)'),
    fromDate: z.string().optional().describe('Start date for envelope search (ISO 8601 format: YYYY-MM-DD)'),
    toDate: z.string().optional().describe('End date for envelope search (ISO 8601 format: YYYY-MM-DD)'),
    count: z.number().min(1).max(100).optional().describe('Maximum number of envelopes to return (1-100, default: 20)')
  }).optional().describe('Optional filters for listing envelopes')
}).describe('List envelopes for a DocuSign account with optional filtering');

/**
 * Schema for create_envelope_from_template tool
 * Creates an envelope using a pre-existing template
 */
export const CreateEnvelopeFromTemplateSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  templateId: z.string().describe('Unique identifier of the DocuSign template to use'),
  recipients: z.array(z.object({
    email: z.string().email().describe('Email address of the recipient'),
    name: z.string().describe('Full name of the recipient'),
    roleName: z.string().describe('Role name as defined in the template (e.g., "Signer1", "Approver")')
  })).describe('List of recipients mapped to template roles'),
  emailSubject: z.string().optional().describe('Subject line for the signing request email (uses template default if not provided)'),
  options: z.object({
    status: z.enum(['sent', 'created']).optional().describe('Envelope status: "sent" (immediate) or "created" (draft) - default: sent'),
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)')
  }).optional().describe('Optional configuration for envelope creation')
}).describe('Create and send an envelope using a pre-configured DocuSign template');

/**
 * Schema for list_templates tool
 * Lists available envelope templates
 */
export const ListTemplatesSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  options: z.object({
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)'),
    count: z.number().min(1).max(100).optional().describe('Maximum number of templates to return (1-100, default: 20)'),
    searchText: z.string().optional().describe('Search templates by name (partial match)')
  }).optional().describe('Optional filters for listing templates')
}).describe('List available envelope templates for a DocuSign account');

/**
 * Schema for download_document tool
 * Downloads a document from a completed envelope
 */
export const DownloadDocumentSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  envelopeId: z.string().describe('Unique identifier of the envelope containing the document'),
  documentId: z.string().describe('Unique identifier of the document to download (use "combined" for all docs)'),
  options: z.object({
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)'),
    certificate: z.boolean().optional().describe('Include certificate of completion (default: false)')
  }).optional().describe('Optional configuration for document download')
}).describe('Download a document or certificate from a DocuSign envelope');

/**
 * Schema for void_envelope tool
 * Voids (cancels) a sent envelope
 */
export const VoidEnvelopeSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  envelopeId: z.string().describe('Unique identifier of the envelope to void'),
  voidReason: z.string().describe('Reason for voiding the envelope (required by DocuSign)'),
  options: z.object({
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)')
  }).optional().describe('Optional configuration for voiding')
}).describe('Void (cancel) a DocuSign envelope that has been sent but not completed');

/**
 * Schema for get_recipient_status tool
 * Gets detailed status of all recipients in an envelope
 */
export const GetRecipientStatusSchema = z.object({
  accessToken: z.string().describe('OAuth 2.0 access token for DocuSign API authentication'),
  envelopeId: z.string().describe('Unique identifier of the envelope to check recipients'),
  options: z.object({
    accountId: z.string().optional().describe('DocuSign account ID (if not using default account)')
  }).optional().describe('Optional configuration for recipient status retrieval')
}).describe('Get detailed status information for all recipients of a DocuSign envelope');

#!/usr/bin/env node

/**
 * DocuSign MCP Server
 *
 * Following AgenticLedger Platform MCP Server Build Pattern v1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  SendEnvelopeSchema,
  GetEnvelopeStatusSchema,
  ListEnvelopesSchema,
  CreateEnvelopeFromTemplateSchema,
  ListTemplatesSchema,
  DownloadDocumentSchema,
  VoidEnvelopeSchema,
  GetRecipientStatusSchema
} from './schemas.js';

import {
  sendEnvelope,
  getEnvelopeStatus,
  listEnvelopes,
  createEnvelopeFromTemplate,
  listTemplates,
  downloadDocument,
  voidEnvelope,
  getRecipientStatus
} from './tools.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: '@agenticledger/docusign-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * List all available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'send_envelope',
        description: SendEnvelopeSchema.description || 'Send a document for electronic signature via DocuSign',
        inputSchema: zodToJsonSchema(SendEnvelopeSchema)
      },
      {
        name: 'get_envelope_status',
        description: GetEnvelopeStatusSchema.description || 'Get the current status and details of a DocuSign envelope',
        inputSchema: zodToJsonSchema(GetEnvelopeStatusSchema)
      },
      {
        name: 'list_envelopes',
        description: ListEnvelopesSchema.description || 'List envelopes for a DocuSign account with optional filtering',
        inputSchema: zodToJsonSchema(ListEnvelopesSchema)
      },
      {
        name: 'create_envelope_from_template',
        description: CreateEnvelopeFromTemplateSchema.description || 'Create and send an envelope using a pre-configured DocuSign template',
        inputSchema: zodToJsonSchema(CreateEnvelopeFromTemplateSchema)
      },
      {
        name: 'list_templates',
        description: ListTemplatesSchema.description || 'List available envelope templates for a DocuSign account',
        inputSchema: zodToJsonSchema(ListTemplatesSchema)
      },
      {
        name: 'download_document',
        description: DownloadDocumentSchema.description || 'Download a document or certificate from a DocuSign envelope',
        inputSchema: zodToJsonSchema(DownloadDocumentSchema)
      },
      {
        name: 'void_envelope',
        description: VoidEnvelopeSchema.description || 'Void (cancel) a DocuSign envelope that has been sent but not completed',
        inputSchema: zodToJsonSchema(VoidEnvelopeSchema)
      },
      {
        name: 'get_recipient_status',
        description: GetRecipientStatusSchema.description || 'Get detailed status information for all recipients of a DocuSign envelope',
        inputSchema: zodToJsonSchema(GetRecipientStatusSchema)
      }
    ]
  };
});

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'send_envelope': {
        const validatedArgs = SendEnvelopeSchema.parse(args);
        const result = await sendEnvelope(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      case 'get_envelope_status': {
        const validatedArgs = GetEnvelopeStatusSchema.parse(args);
        const result = await getEnvelopeStatus(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      case 'list_envelopes': {
        const validatedArgs = ListEnvelopesSchema.parse(args);
        const result = await listEnvelopes(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      case 'create_envelope_from_template': {
        const validatedArgs = CreateEnvelopeFromTemplateSchema.parse(args);
        const result = await createEnvelopeFromTemplate(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      case 'list_templates': {
        const validatedArgs = ListTemplatesSchema.parse(args);
        const result = await listTemplates(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      case 'download_document': {
        const validatedArgs = DownloadDocumentSchema.parse(args);
        const result = await downloadDocument(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      case 'void_envelope': {
        const validatedArgs = VoidEnvelopeSchema.parse(args);
        const result = await voidEnvelope(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      case 'get_recipient_status': {
        const validatedArgs = GetRecipientStatusSchema.parse(args);
        const result = await getRecipientStatus(validatedArgs);

        if (!result.success) {
          throw new McpError(ErrorCode.InternalError, result.error || 'Unknown error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation error: ${error.message}`
      );
    }

    // Generic error handling
    throw new McpError(
      ErrorCode.InternalError,
      error instanceof Error ? error.message : String(error)
    );
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DocuSign MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

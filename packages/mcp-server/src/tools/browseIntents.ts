/**
 * MCP tool: private_otc_browse_intents
 *
 * Lists open intents. Asset pairs visible, amounts encrypted.
 */

export const browseIntentsTool = {
  name: "private_otc_browse_intents",
  description:
    "List currently open OTC intents on PrivateOTC. Returns asset pairs and metadata; encrypted amounts are not decrypted unless caller is authorized.",
  inputSchema: {
    type: "object",
    properties: {
      sellToken: {
        type: "string",
        description: "Filter by sell token address (optional)",
      },
      buyToken: {
        type: "string",
        description: "Filter by buy token address (optional)",
      },
      mode: {
        type: "string",
        enum: ["direct", "rfq", "all"],
        description: "Filter by mode (default: all)",
      },
    },
  },
  async handler(_args: Record<string, unknown>) {
    // TODO: Query PrivateOTC contract via viem
    //   1. Read nextIntentId
    //   2. Iterate intents, filter status == Open && deadline > now
    //   3. Apply filters
    //   4. Return array of { id, maker, sellToken, buyToken, mode, deadline }

    return {
      content: [
        {
          type: "text",
          text: "TODO: browseIntents implementation — wire viem read",
        },
      ],
    };
  },
};

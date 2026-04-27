/**
 * MCP tool: private_otc_create_intent
 *
 * Creates a new OTC intent. Encrypts amount + min price via Nox SDK,
 * submits on-chain. AI agent receives intent ID for follow-up.
 */

export const createIntentTool = {
  name: "private_otc_create_intent",
  description:
    "Create a new OTC intent. Encrypts the sell amount and min buy price via Nox, submits to PrivateOTC contract on Arbitrum Sepolia. Returns the intent ID.",
  inputSchema: {
    type: "object",
    properties: {
      sellToken: {
        type: "string",
        description:
          "Address of the cToken to sell (e.g. cUSDC, cETH on Arbitrum Sepolia)",
      },
      buyToken: {
        type: "string",
        description: "Address of the cToken to receive",
      },
      sellAmount: {
        type: "string",
        description: "Amount to sell (raw on-chain units, will be encrypted)",
      },
      minBuyAmount: {
        type: "string",
        description: "Minimum acceptable buy amount (raw, will be encrypted)",
      },
      deadlineSeconds: {
        type: "number",
        description: "Seconds until intent expires (e.g. 3600 = 1 hour)",
      },
      mode: {
        type: "string",
        enum: ["direct", "rfq"],
        description: "Direct OTC (1-to-1) or RFQ (multi-bidder Vickrey)",
      },
      allowedTaker: {
        type: "string",
        description:
          "Optional: address allowed to accept (Direct mode only). Empty = open to all.",
      },
    },
    required: ["sellToken", "buyToken", "sellAmount", "deadlineSeconds", "mode"],
  },
  async handler(_args: Record<string, unknown>) {
    // TODO: Wire actual flow:
    //   1. Validate args via zod
    //   2. Build viem walletClient from AGENT_PRIVATE_KEY
    //   3. nox.encryptInput(sellAmount), nox.encryptInput(minBuyAmount)
    //   4. Call PrivateOTC.createIntent or createRFQ
    //   5. Return { intentId, txHash }

    return {
      content: [
        {
          type: "text",
          text: "TODO: createIntent implementation — wire viem + Nox SDK",
        },
      ],
    };
  },
};

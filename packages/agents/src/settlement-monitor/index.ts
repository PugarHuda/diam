/**
 * Settlement Monitor Agent — post-trade verifier.
 *
 * Listens for Settled events. Auto-decrypts amounts using auditor key.
 * Verifies trade matched expected outcome. Posts to webhook + writes
 * encrypted audit log.
 */

export async function startSettlementMonitor() {
  console.log("[settlement-monitor] started");

  // TODO: viem watchContractEvent on PrivateOTC.Settled
  // For each Settled event:
  //   1. Fetch maker's outgoing balance handle (post-settle)
  //   2. Decrypt via auditor's stored key
  //   3. Compare against expected sell amount
  //   4. POST { id, taker, ok, timestamp } to webhook
}

/**
 * RFQ Sweeper Agent — finalize expired RFQs.
 *
 * Polls every 5 minutes. Avoids stuck state where RFQ deadline has
 * passed but nobody called finalize(). Saves user gas + reduces friction.
 */

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

export async function startRfqSweeper() {
  console.log("[rfq-sweeper] started");

  setInterval(() => {
    sweepOnce().catch((err) => console.error("[rfq-sweeper]", err));
  }, SWEEP_INTERVAL_MS);

  await sweepOnce();
}

async function sweepOnce() {
  // TODO: Query indexer (or scan recent IntentCreated events) for RFQs where:
  //   - mode == RFQ
  //   - status == Open
  //   - block.timestamp > deadline
  // Then call PrivateOTC.finalizeRFQ(id)
}

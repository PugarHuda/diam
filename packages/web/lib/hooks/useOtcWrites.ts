"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { decodeEventLog } from "viem";
import { privateOtcAbi } from "@/lib/abi/privateOtc";
import { PRIVATE_OTC_ADDRESS } from "@/lib/wagmi";
import { useNoxClient, encryptUint256 } from "@/lib/nox-client";

export type WriteStep =
  | "idle"
  | "encrypting"
  | "signing"
  | "confirming"
  | "done"
  | "error";

type WriteState = {
  step: WriteStep;
  error: string | null;
  txHash: `0x${string}` | null;
};

const initial: WriteState = { step: "idle", error: null, txHash: null };

/* -------------------------------------------------------------------------- */
/*                                createRFQ                                   */
/* -------------------------------------------------------------------------- */

export type CreateRfqInput = {
  sellToken: `0x${string}`;
  buyToken: `0x${string}`;
  sellAmount: bigint;
  biddingDeadlineSeconds: number;
};

export function useCreateRfq() {
  const { address } = useAccount();
  const { ready, getClient } = useNoxClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<WriteState>(initial);
  const [intentId, setIntentId] = useState<bigint | null>(null);

  const receipt = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  async function submit(input: CreateRfqInput) {
    if (!address) throw new Error("Wallet not connected");
    if (!ready) throw new Error("Nox client not ready");
    setState({ step: "encrypting", error: null, txHash: null });

    try {
      const client = await getClient();
      if (!client) throw new Error("Nox client unavailable");

      const sell = await encryptUint256(client, input.sellAmount, PRIVATE_OTC_ADDRESS);

      setState((s) => ({ ...s, step: "signing" }));
      const deadline =
        BigInt(Math.floor(Date.now() / 1000)) +
        BigInt(input.biddingDeadlineSeconds);

      const hash = await writeContractAsync({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "createRFQ",
        args: [
          input.sellToken,
          input.buyToken,
          sell.handle as `0x${string}`,
          sell.proof,
          deadline,
        ],
      });
      setState({ step: "confirming", error: null, txHash: hash });
    } catch (err) {
      setState({
        step: "error",
        error: err instanceof Error ? err.message : String(err),
        txHash: null,
      });
    }
  }

  if (receipt.data && state.step === "confirming") {
    for (const log of receipt.data.logs) {
      try {
        const decoded = decodeEventLog({
          abi: privateOtcAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "IntentCreated") {
          setIntentId(decoded.args.id);
          setState((s) => ({ ...s, step: "done" }));
          break;
        }
      } catch {
        // skip
      }
    }
  }

  return { submit, ...state, intentId };
}

/* -------------------------------------------------------------------------- */
/*                                acceptIntent                                */
/* -------------------------------------------------------------------------- */

export function useAcceptIntent() {
  const { address } = useAccount();
  const { ready, getClient } = useNoxClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<WriteState>(initial);
  const receipt = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  async function submit(intentId: bigint, buyAmount: bigint) {
    if (!address) throw new Error("Wallet not connected");
    if (!ready) throw new Error("Nox client not ready");
    setState({ step: "encrypting", error: null, txHash: null });

    try {
      const client = await getClient();
      if (!client) throw new Error("Nox client unavailable");

      const buy = await encryptUint256(client, buyAmount, PRIVATE_OTC_ADDRESS);

      setState((s) => ({ ...s, step: "signing" }));
      const hash = await writeContractAsync({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "acceptIntent",
        args: [intentId, buy.handle as `0x${string}`, buy.proof],
      });
      setState({ step: "confirming", error: null, txHash: hash });
    } catch (err) {
      setState({
        step: "error",
        error: err instanceof Error ? err.message : String(err),
        txHash: null,
      });
    }
  }

  if (receipt.isSuccess && state.step === "confirming") {
    setState((s) => ({ ...s, step: "done" }));
  }

  return { submit, ...state };
}

/* -------------------------------------------------------------------------- */
/*                                submitBid                                   */
/* -------------------------------------------------------------------------- */

export function useSubmitBid() {
  const { address } = useAccount();
  const { ready, getClient } = useNoxClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<WriteState>(initial);
  const receipt = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  async function submit(rfqId: bigint, bidAmount: bigint) {
    if (!address) throw new Error("Wallet not connected");
    if (!ready) throw new Error("Nox client not ready");
    setState({ step: "encrypting", error: null, txHash: null });

    try {
      const client = await getClient();
      if (!client) throw new Error("Nox client unavailable");

      const bid = await encryptUint256(client, bidAmount, PRIVATE_OTC_ADDRESS);

      setState((s) => ({ ...s, step: "signing" }));
      const hash = await writeContractAsync({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "submitBid",
        args: [rfqId, bid.handle as `0x${string}`, bid.proof],
      });
      setState({ step: "confirming", error: null, txHash: hash });
    } catch (err) {
      setState({
        step: "error",
        error: err instanceof Error ? err.message : String(err),
        txHash: null,
      });
    }
  }

  if (receipt.isSuccess && state.step === "confirming") {
    setState((s) => ({ ...s, step: "done" }));
  }

  return { submit, ...state };
}

/* -------------------------------------------------------------------------- */
/*                                finalizeRFQ                                 */
/* -------------------------------------------------------------------------- */

export function useFinalizeRfq() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<WriteState>(initial);
  const receipt = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  async function submit(rfqId: bigint) {
    setState({ step: "signing", error: null, txHash: null });
    try {
      const hash = await writeContractAsync({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "finalizeRFQ",
        args: [rfqId],
      });
      setState({ step: "confirming", error: null, txHash: hash });
    } catch (err) {
      setState({
        step: "error",
        error: err instanceof Error ? err.message : String(err),
        txHash: null,
      });
    }
  }

  if (receipt.isSuccess && state.step === "confirming") {
    setState((s) => ({ ...s, step: "done" }));
  }

  return { submit, ...state };
}

/* -------------------------------------------------------------------------- */
/*                                cancelIntent                                */
/* -------------------------------------------------------------------------- */

export function useCancelIntent() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<WriteState>(initial);
  const receipt = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  async function submit(intentId: bigint) {
    setState({ step: "signing", error: null, txHash: null });
    try {
      const hash = await writeContractAsync({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "cancelIntent",
        args: [intentId],
      });
      setState({ step: "confirming", error: null, txHash: hash });
    } catch (err) {
      setState({
        step: "error",
        error: err instanceof Error ? err.message : String(err),
        txHash: null,
      });
    }
  }

  if (receipt.isSuccess && state.step === "confirming") {
    setState((s) => ({ ...s, step: "done" }));
  }

  return { submit, ...state };
}

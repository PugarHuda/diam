"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { decodeEventLog } from "viem";
import { privateOtcAbi } from "@/lib/abi/privateOtc";
import { PRIVATE_OTC_ADDRESS } from "@/lib/wagmi";
import { useNoxClient, encryptUint256 } from "@/lib/nox-client";

export type CreateIntentInput = {
  sellToken: `0x${string}`;
  buyToken: `0x${string}`;
  sellAmount: bigint;
  minBuyAmount: bigint;
  deadlineSeconds: number; // seconds from now
  allowedTaker?: `0x${string}`;
};

export type CreateIntentStep =
  | "idle"
  | "encrypting"
  | "signing"
  | "confirming"
  | "done"
  | "error";

export function useCreateIntent() {
  const { address } = useAccount();
  const { ready, getClient } = useNoxClient();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<CreateIntentStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [intentId, setIntentId] = useState<bigint | null>(null);

  const receipt = useWaitForTransactionReceipt({ hash: txHash ?? undefined });

  async function submit(input: CreateIntentInput) {
    if (!address) throw new Error("Wallet not connected");
    if (!ready) throw new Error("Nox client not ready");
    setError(null);

    try {
      // 1) Encrypt off-chain
      setStep("encrypting");
      const client = await getClient();
      if (!client) throw new Error("Nox client unavailable");

      const sell = await encryptUint256(
        client,
        input.sellAmount,
        PRIVATE_OTC_ADDRESS
      );
      const minBuy = await encryptUint256(
        client,
        input.minBuyAmount,
        PRIVATE_OTC_ADDRESS
      );

      // 2) Sign + send
      setStep("signing");
      const deadline =
        BigInt(Math.floor(Date.now() / 1000)) + BigInt(input.deadlineSeconds);

      const hash = await writeContractAsync({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "createIntent",
        args: [
          input.sellToken,
          input.buyToken,
          sell.handle as `0x${string}`,
          sell.proof,
          minBuy.handle as `0x${string}`,
          minBuy.proof,
          deadline,
          input.allowedTaker ??
            ("0x0000000000000000000000000000000000000000" as `0x${string}`),
        ],
      });
      setTxHash(hash);

      setStep("confirming");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Once confirmed, parse event for intentId
  if (receipt.data && step === "confirming") {
    for (const log of receipt.data.logs) {
      try {
        const decoded = decodeEventLog({
          abi: privateOtcAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "IntentCreated") {
          setIntentId(decoded.args.id);
          setStep("done");
          break;
        }
      } catch {
        // Not our event, skip
      }
    }
  }

  return { submit, step, error, txHash, intentId, receipt };
}

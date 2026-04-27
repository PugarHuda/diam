"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useNoxClient, encryptUint256 } from "@/lib/nox-client";

const FAUCET_ABI = [
  {
    type: "function",
    name: "faucet",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountHandle", type: "bytes32" },
      { name: "amountProof", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export type FaucetStep =
  | "idle"
  | "encrypting"
  | "signing"
  | "confirming"
  | "done"
  | "error";

export function useFaucet() {
  const { address } = useAccount();
  const { ready, getClient } = useNoxClient();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<FaucetStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const receipt = useWaitForTransactionReceipt({ hash: txHash ?? undefined });

  if (receipt.isSuccess && step === "confirming") {
    setStep("done");
  }

  async function mint(tokenAddress: `0x${string}`, amount: bigint) {
    if (!address) throw new Error("Wallet not connected");
    if (!ready) throw new Error("Nox client not ready");
    setError(null);

    try {
      setStep("encrypting");
      const client = await getClient();
      if (!client) throw new Error("Nox client unavailable");

      const enc = await encryptUint256(client, amount, tokenAddress);

      setStep("signing");
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: FAUCET_ABI,
        functionName: "faucet",
        args: [enc.handle as `0x${string}`, enc.proof],
      });
      setTxHash(hash);
      setStep("confirming");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return { mint, step, error, txHash };
}

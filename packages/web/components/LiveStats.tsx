"use client";

import { useEffect, useState } from "react";
import { useReadContract, useBlockNumber } from "wagmi";
import { privateOtcAbi } from "@/lib/abi/privateOtc";
import { PRIVATE_OTC_ADDRESS } from "@/lib/wagmi";

/**
 * Live on-chain counter — proves Diam connected to actual Arbitrum Sepolia state.
 * Reads PrivateOTC.nextIntentId() and animates whenever it increments.
 */
export function LiveStats() {
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const { data: nextIntentId, refetch } = useReadContract({
    address: PRIVATE_OTC_ADDRESS,
    abi: privateOtcAbi,
    functionName: "nextIntentId",
  });

  const [animKey, setAnimKey] = useState(0);
  const [prevValue, setPrevValue] = useState<bigint | undefined>();

  // Refetch on every new block — keeps counter live
  useEffect(() => {
    if (blockNumber) refetch();
  }, [blockNumber, refetch]);

  // Trigger animation when value changes
  useEffect(() => {
    if (nextIntentId !== undefined && nextIntentId !== prevValue) {
      if (prevValue !== undefined) setAnimKey((k) => k + 1);
      setPrevValue(nextIntentId as bigint);
    }
  }, [nextIntentId, prevValue]);

  const total = nextIntentId ? Number(nextIntentId) : 0;

  return (
    <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
      <Stat
        icon="receipt_long"
        label="ON-CHAIN INTENTS"
        value={total.toString()}
        animKey={animKey}
        live
      />
      <Stat
        icon="verified_user"
        label="ENCRYPTION"
        value="NOX_TEE"
      />
      <Stat
        icon="hub"
        label="CHAIN_ID"
        value="421614"
      />
      <Stat
        icon="speed"
        label="BLOCK_TIME"
        value="~250ms"
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  animKey,
  live,
}: {
  icon: string;
  label: string;
  value: string;
  animKey?: number;
  live?: boolean;
}) {
  return (
    <div className="glass-card relative overflow-hidden p-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-[--color-primary]">
          {icon}
        </span>
        <p className="text-label-caps text-zinc-500">{label}</p>
        {live && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[--color-primary] pulse-soft" />
        )}
      </div>
      <p
        key={animKey}
        className="mt-2 font-display text-2xl font-bold text-[--color-primary] count-enter"
        data-numeric
      >
        {value}
      </p>
    </div>
  );
}

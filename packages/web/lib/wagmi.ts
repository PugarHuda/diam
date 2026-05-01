import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";

// CI sets the env var to "" (empty string) when no real projectId is
// available — `??` only falls back on undefined/null, so we need `||`
// to also catch empty. RainbowKit's getDefaultConfig refuses empty
// projectId at module load time, breaking SSR prerender of /_not-found.
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "private-otc-dev";

export const wagmiConfig = getDefaultConfig({
  appName: "PrivateOTC",
  projectId,
  chains: [arbitrumSepolia, arbitrum],
  ssr: true,
});

export const PRIVATE_OTC_ADDRESS =
  (process.env.NEXT_PUBLIC_PRIVATE_OTC_ADDRESS as `0x${string}`) ?? "0x0";

export const CUSDC_ADDRESS =
  (process.env.NEXT_PUBLIC_CUSDC_ADDRESS as `0x${string}`) ?? "0x0";

export const CETH_ADDRESS =
  (process.env.NEXT_PUBLIC_CETH_ADDRESS as `0x${string}`) ?? "0x0";

export const DIAM_RECEIPT_ADDRESS =
  (process.env.NEXT_PUBLIC_DIAM_RECEIPT_ADDRESS as `0x${string}`) ?? "0x0";

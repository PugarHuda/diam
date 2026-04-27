import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "private-otc-dev";

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

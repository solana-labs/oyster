import { PublicKey } from "@solana/web3.js";
import { useMint } from "../contexts/accounts";
import { LendingReserve, reserveMarketCap } from "../models/lending";
import { fromLamports } from "../utils/utils";
import { useUserBalance } from "./useUserBalance";

export function useCollateralBalance(
  reserve?: LendingReserve,
  account?: PublicKey
) {
  const mint = useMint(reserve?.collateralMint);
  const { balanceLamports, accounts } = useUserBalance(
    reserve?.collateralMint,
    account
  );

  const collateralRatioLamports =
    reserveMarketCap(reserve) *
    (balanceLamports / (reserve?.collateralMintSupply.toNumber() || 1));

  return {
    balance: fromLamports(collateralRatioLamports, mint),
    balanceLamports: collateralRatioLamports,
    mint: reserve?.collateralMint,
    accounts,
  };
}

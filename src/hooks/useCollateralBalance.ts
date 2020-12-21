import { PublicKey } from "@solana/web3.js";
import { useMint } from "../contexts/accounts";
import { LendingReserve, reserveMarketCap } from "../models/lending";
import { fromLamports } from "../utils/utils";
import { useUserBalance } from "./useUserBalance";

export function useUserCollateralBalance(
  reserve?: LendingReserve,
  account?: PublicKey
) {
  const mint = useMint(reserve?.collateralMint);
  const { balanceLamports, accounts } = useUserBalance(
    reserve?.collateralMint,
    account
  );

  const collateralBalance = reserve &&
    calculateCollateralBalance(reserve, balanceLamports);

  return {
    balance: fromLamports(collateralBalance, mint),
    balanceLamports: collateralBalance,
    mint: reserve?.collateralMint,
    accounts,
  };
}
export function calculateCollateralBalance(
  reserve: LendingReserve,
  balanceLamports: number) {
  return reserveMarketCap(reserve) *
    (balanceLamports / (reserve?.collateralMintSupply.toNumber() || 1));
}


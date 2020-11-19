import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useAccount, useMint } from "../contexts/accounts";
import { LendingReserve } from "../models/lending";
import { fromLamports } from "../utils/utils";
import { useUserAccounts } from "./useUserAccounts";
import { useUserBalance } from "./useUserBalance";

export function useCollateralBalance(reserve?: LendingReserve) {
  const mint = useMint(reserve?.collateralMint);
  const { balance: nativeBalance, accounts  } = useUserBalance(reserve?.collateralMint, true);

  const balance = fromLamports((reserve?.totalLiquidity.toNumber() || 0) * (nativeBalance / (reserve?.collateralMintSupply.toNumber() || 1)), mint);

  return { balance, accounts };
}
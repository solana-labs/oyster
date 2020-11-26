import { ParsedAccount } from "../contexts/accounts";
import { LendingReserve } from "../models/lending";
import { useUserAccounts } from "./useUserAccounts";
import { useLendingReserves } from "./useLendingReserves";
import { useMemo } from "react";

export function useUserDeposits() {
  const { userAccounts } = useUserAccounts();
  const { reserveAccounts } = useLendingReserves();

  const reservesByCollateralMint = useMemo(() => {
    return reserveAccounts.reduce((result, item) => {
      result.set(item.info.collateralMint.toBase58(), item);
      return result;
    }
    , new Map<string, ParsedAccount<LendingReserve>>())
  }, [reserveAccounts]);

  const userDeposits = useMemo(() => {
    return userAccounts
      .filter((acc) => reservesByCollateralMint.has(acc.info.mint.toBase58()))
      .map(item => ({
        account: item, 
        reserve: reservesByCollateralMint.get(item.info.mint.toBase58()) as ParsedAccount<LendingReserve>,
      }));
  }, [userAccounts, reservesByCollateralMint]);

  return {
    userDeposits
  };
}

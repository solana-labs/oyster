import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useMidPriceInUSD } from "../contexts/market";
import { useLendingMarket } from "./useLendingMarket";
import { useLendingReserve } from "./useLendingReserves";
import { useUserDeposits } from "./useUserDeposits";

export function useBorrowingPower(reserveAddress: string | PublicKey) {
  const key = useMemo(() => typeof reserveAddress === 'string' ? reserveAddress : reserveAddress.toBase58(), [reserveAddress]);
  const exclude = useMemo(() => new Set([key]), [key]);
  const { totalInQuote  } = useUserDeposits(exclude)
  const reserve = useLendingReserve(key);

  const liquidityMint = reserve?.info.liquidityMint;
  const market = useLendingMarket(liquidityMint);
  const price = useMidPriceInUSD(liquidityMint.toBase58()).price;

  // amounts already expressed as quite mint
  if(liquidityMint.toBase58() === market?.info.quoteMint?.toBase58()) {
    return {
      borrowingPower: totalInQuote,
      totalInQuote,
    };
  } 

  return {
    borrowingPower: totalInQuote / price,
    totalInQuote,
  };
}

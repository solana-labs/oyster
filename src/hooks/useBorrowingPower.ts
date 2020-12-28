import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useMidPriceInUSD } from "../contexts/market";
import { useLendingMarket } from "./useLendingMarket";
import { getLendingReserves, useLendingReserve } from "./useLendingReserves";
import { useUserDeposits } from "./useUserDeposits";

// TODO: add option to decrease buying power by overcollateralization factor

export function useBorrowingPower(reserveAddress: string | PublicKey, overcollateralize = true) {
  const key = useMemo(() => typeof reserveAddress === 'string' ? reserveAddress : reserveAddress.toBase58(), [reserveAddress]);

  const reserve = useLendingReserve(key);

  const liquidityMint = reserve?.info.liquidityMint;
  const liquidityMintAddress = liquidityMint?.toBase58();
  const market = useLendingMarket(reserve?.info.lendingMarket);

  const quoteMintAddess = market?.info?.quoteMint?.toBase58();

  // TODO: remove once cross-collateral is supported
  const onlyQuoteAllowed = liquidityMintAddress !==
    quoteMintAddess;

  const exclude = useMemo(() => new Set(
    [key]),
    [key]);
  const inlcude = useMemo(() => {
    const quoteReserve = getLendingReserves()
      .find(r => r.info.liquidityMint.toBase58() === quoteMintAddess);
    return onlyQuoteAllowed && quoteReserve ?
      new Set([quoteReserve.pubkey.toBase58()]) :
      undefined;
  }, [onlyQuoteAllowed, quoteMintAddess]);

  const { totalInQuote } = useUserDeposits(exclude, inlcude)

  const price = useMidPriceInUSD(liquidityMintAddress).price;

  // amounts already expressed as quite mint
  if (liquidityMintAddress === market?.info.quoteMint?.toBase58()) {
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

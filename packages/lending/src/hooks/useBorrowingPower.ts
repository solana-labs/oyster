import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { usePrice } from '../contexts/pyth';
import { useLendingReserve } from './useLendingReserves';
import { useUserDeposits } from './useUserDeposits';
import { useUserObligations } from './useUserObligations';

// TODO: add option to decrease buying power by overcollateralization factor
// TODO: add support for balance in the wallet
export function useBorrowingPower(
  reserveAddress: string | PublicKey | undefined,
  includeWallet = false,
  overcollateralize = true,
) {
  const key = useMemo(
    () =>
      typeof reserveAddress === 'string'
        ? reserveAddress
        : reserveAddress?.toBase58() || '',
    [reserveAddress],
  );

  const reserve = useLendingReserve(key);

  const liquidityMint = reserve?.info.liquidity.mintPubkey;
  const liquidityMintAddress = liquidityMint?.toBase58();

  const exclude = useMemo(() => new Set([key]), [key]);
  const inlcude = undefined;

  const { totalInQuote } = useUserDeposits(exclude, inlcude);

  const price = usePrice(liquidityMintAddress);

  const { totalInQuote: loansValue } = useUserObligations();

  const totalDeposits = loansValue + totalInQuote;

  const utilization = totalDeposits === 0 ? 0 : loansValue / totalDeposits;

  return {
    borrowingPower: totalInQuote / price,
    totalInQuote,
    utilization,
  };
}

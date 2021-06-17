import { contexts, fromLamports } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';
import { Reserve, reserveMarketCap } from '../models';
import { usePrice } from '../contexts/pyth';
import { useUserBalance } from './useUserBalance';

const { useMint } = contexts.Accounts;

export function useUserCollateralBalance(
  reserve?: Reserve,
  account?: PublicKey,
) {
  const mint = useMint(reserve?.collateral.mintPubkey);
  const { balanceLamports: userBalance, accounts } = useUserBalance(
    reserve?.collateral.mintPubkey,
    account,
  );

  const [balanceInUSD, setBalanceInUSD] = useState(0);

  const balanceLamports = useMemo(
    () => reserve && calculateCollateralBalance(reserve, userBalance),
    [userBalance, reserve],
  );

  const balance = useMemo(() => fromLamports(balanceLamports, mint), [
    balanceLamports,
    mint,
  ]);

  const price = usePrice(reserve?.liquidity.mintPubkey.toBase58() || '');

  useEffect(() => {
    setBalanceInUSD(balance * price);
  }, [setBalanceInUSD, balance, price]);

  return {
    balance,
    balanceLamports,
    balanceInUSD,
    mint: reserve?.collateral.mintPubkey,
    accounts,
    hasBalance: accounts.length > 0 && balance > 0,
  };
}
export function calculateCollateralBalance(
  reserve: Reserve,
  balanceLamports: number,
) {
  return (
    reserveMarketCap(reserve) *
    (balanceLamports / (reserve?.collateral.mintTotalSupply.toNumber() || 1))
  );
}

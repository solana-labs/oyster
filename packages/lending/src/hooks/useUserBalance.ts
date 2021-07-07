import { contexts, fromLamports, useUserAccounts } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';
import { usePrice } from '../contexts/pyth';

const { useMint } = contexts.Accounts;

export function useUserBalance(
  mintAddress?: PublicKey | string,
  account?: PublicKey,
) {
  const mint = useMemo(
    () =>
      typeof mintAddress === 'string' ? mintAddress : mintAddress?.toBase58(),
    [mintAddress],
  );
  const { userAccounts } = useUserAccounts();
  const [balanceInUSD, setBalanceInUSD] = useState(0);

  const mintInfo = useMint(mint);
  const accounts = useMemo(() => {
    return userAccounts
      .filter(
        acc =>
          mint === acc.info.mint.toBase58() &&
          (!account || account.equals(acc.pubkey)),
      )
      .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());
  }, [userAccounts, mint, account]);

  const balanceLamports = useMemo(() => {
    return accounts.reduce(
      (res, item) => (res += item.info.amount.toNumber()),
      0,
    );
  }, [accounts]);

  const balance = useMemo(() => fromLamports(balanceLamports, mintInfo), [
    mintInfo,
    balanceLamports,
  ]);

  const price = usePrice(mint || '');

  useEffect(() => {
    setBalanceInUSD(balance * price);
  }, [setBalanceInUSD, balance, price]);

  return {
    balance,
    balanceLamports,
    balanceInUSD,
    accounts,
    hasBalance: accounts.length > 0 && balance > 0,
  };
}

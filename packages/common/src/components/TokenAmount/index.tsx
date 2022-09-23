import React, { useMemo } from 'react';
import BN from 'bn.js';
import { TokenAccount } from '../../models';
import { useMintFormatter, useUserAccounts } from '../../hooks';
import { WRAPPED_SOL_MINT } from '../../utils';


export const AmountItem = ({ account }: { account: TokenAccount }) => {
  const { formatValue } = useMintFormatter(account.info.mint);

  const amount = useMemo(() => {
    return formatValue(new BN(account.info.amount as BN || 0));
  }, [account]);

  return <>
    <span style={{ marginRight: 4 }}>{amount} NEON</span>
  </>;
};

export const TokenAmount = () => {
  const { userAccounts } = useUserAccounts();

  const accounts = useMemo(() => {
    return userAccounts.filter(u => u?.info.mint.toBase58() !== WRAPPED_SOL_MINT.toBase58());
  }, [userAccounts]);

  return <>
    {accounts.map((a, k) => <AmountItem account={a} key={k}/>)}
  </>;
}

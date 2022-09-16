import React, { useMemo } from 'react';
import { contexts, useAccountByMint } from '@oyster/common';
import { ProgramAccount, Realm, TokenOwnerRecord } from '@solana/spl-governance';
import { MintInfo } from '@solana/spl-token';
import BN from 'bn.js';

import { formatMintNaturalAmountAsDecimal, formatMintVoteWeight } from '../../tools/units';
import { useMintFormatter } from '../../hooks/useMintFormatter';
import { useDepositedAccountsContext } from './realmDepositProvider';

const { useMint } = contexts.Accounts;

export interface RealmDepositBadgeProps {
  councilTokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  communityTokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  realm?: ProgramAccount<Realm>;
  showVoteWeights?: boolean;
}

// TODO:
export function RealmDepositBadge(props: RealmDepositBadgeProps) {
  const { realm } = props;
  const governingTokenAccount = useAccountByMint(realm?.account.communityMint);
  const { formatValue } = useMintFormatter(realm?.account.communityMint) || {};
  const { depositedAccounts } = useDepositedAccountsContext();

  const deposited = useMemo(() => {
    return formatValue(depositedAccounts?.reduce((p, c) => p.add(c.balance), new BN(0)) ?? new BN(0));
  }, [depositedAccounts, formatValue]);

  const availableBalance = new BN(governingTokenAccount?.info.amount as BN || 0);

  return !availableBalance.isZero() ? <>
    <div>Available: {formatValue(availableBalance)}</div>
    {deposited.length > 0 && <div>Deposited: {deposited}</div>}
  </> : null;
}

export function RealmDepositBadgeOyster(props: RealmDepositBadgeProps) {
  const {
    councilTokenOwnerRecord,
    communityTokenOwnerRecord,
    showVoteWeights
  } = props;
  const communityMint = useMint(communityTokenOwnerRecord?.account.governingTokenMint);

  const councilMint = useMint(councilTokenOwnerRecord?.account.governingTokenMint);

  if (!councilTokenOwnerRecord && !communityTokenOwnerRecord) {
    return null;
  }

  return (
    <>
      <span>deposited </span>
      {communityTokenOwnerRecord && communityMint && (
        <TokenDepositStatistics
          label='tokens'
          mint={communityMint}
          tokenOwnerRecord={communityTokenOwnerRecord}
          showVoteWeights={showVoteWeights}
        ></TokenDepositStatistics>
      )}
      {communityTokenOwnerRecord && councilTokenOwnerRecord && ' | '}
      {councilTokenOwnerRecord && councilMint && (
        <TokenDepositStatistics
          label='council tokens'
          mint={councilMint}
          tokenOwnerRecord={councilTokenOwnerRecord}
          showVoteWeights={showVoteWeights}
        ></TokenDepositStatistics>
      )}
    </>
  );
}

function TokenDepositStatistics({ label, mint, tokenOwnerRecord, showVoteWeights }: {
  label: string;
  mint: MintInfo;
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>;
  showVoteWeights: boolean | undefined;
}) {
  return (
    <>
      <span>{`${label}: ${formatMintNaturalAmountAsDecimal(
        mint,
        tokenOwnerRecord.account.governingTokenDepositAmount
      )}`}</span>
      {showVoteWeights &&
        !tokenOwnerRecord.account.governingTokenDepositAmount.isZero() && (
          <span>{` (${formatMintVoteWeight(
            mint,
            tokenOwnerRecord.account.governingTokenDepositAmount
          )})`}</span>
        )}
    </>
  );
}

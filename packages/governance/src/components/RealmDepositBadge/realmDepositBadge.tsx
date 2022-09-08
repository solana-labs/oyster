import React from 'react';
import { contexts } from '@oyster/common';
import { ProgramAccount, TokenOwnerRecord } from '@solana/spl-governance';
import { MintInfo } from '@solana/spl-token';

import { formatMintNaturalAmountAsDecimal, formatMintVoteWeight } from '../../tools/units';

const { useMint } = contexts.Accounts;

export interface RealmDepositBadgeProps {
  councilTokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  communityTokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  showVoteWeights?: boolean;
}

// TODO:
export function RealmDepositBadge(props: RealmDepositBadgeProps) {
  return null;
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

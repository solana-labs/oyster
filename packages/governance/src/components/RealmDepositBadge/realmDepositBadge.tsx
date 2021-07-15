import React from 'react';
import { contexts, ParsedAccount } from '@oyster/common';
import { TokenOwnerRecord } from '../../models/accounts';

import {
  formatMintNaturalAmountAsDecimal,
  formatMintVoteWeight,
} from '../../tools/units';
import { MintInfo } from '@solana/spl-token';

const { useMint } = contexts.Accounts;

export function RealmDepositBadge({
  councilTokenOwnerRecord,
  communityTokenOwnerRecord,
  showVoteWeights,
}: {
  councilTokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined;
  communityTokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined;
  showVoteWeights?: boolean;
}) {
  const communityMint = useMint(
    communityTokenOwnerRecord?.info.governingTokenMint,
  );

  const councilMint = useMint(councilTokenOwnerRecord?.info.governingTokenMint);

  if (!councilTokenOwnerRecord && !communityTokenOwnerRecord) {
    return null;
  }

  return (
    <>
      <span>deposited </span>
      {communityTokenOwnerRecord && communityMint && (
        <TokenDepositStatistics
          label="tokens"
          mint={communityMint}
          tokenOwnerRecord={communityTokenOwnerRecord}
          showVoteWeights={showVoteWeights}
        ></TokenDepositStatistics>
      )}
      {communityTokenOwnerRecord && councilTokenOwnerRecord && ' | '}
      {councilTokenOwnerRecord && councilMint && (
        <TokenDepositStatistics
          label="council tokens"
          mint={councilMint}
          tokenOwnerRecord={councilTokenOwnerRecord}
          showVoteWeights={showVoteWeights}
        ></TokenDepositStatistics>
      )}
    </>
  );
}

function TokenDepositStatistics({
  label,
  mint,
  tokenOwnerRecord,
  showVoteWeights,
}: {
  label: string;
  mint: MintInfo;
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord>;
  showVoteWeights: boolean | undefined;
}) {
  return (
    <>
      <span>{`${label}: ${formatMintNaturalAmountAsDecimal(
        mint,
        tokenOwnerRecord.info.governingTokenDepositAmount,
      )}`}</span>
      {showVoteWeights &&
        !tokenOwnerRecord.info.governingTokenDepositAmount.isZero() && (
          <span>{` (${formatMintVoteWeight(
            mint,
            tokenOwnerRecord.info.governingTokenDepositAmount,
          )})`}</span>
        )}
    </>
  );
}

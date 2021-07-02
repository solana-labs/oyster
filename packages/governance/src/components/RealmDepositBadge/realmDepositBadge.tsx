import React from 'react';
import { contexts, ParsedAccount } from '@oyster/common';
import { TokenOwnerRecord } from '../../models/accounts';
import { formatTokenAmount } from '../../tools/text';

const { useMint } = contexts.Accounts;

export function RealmDepositBadge({
  councilTokenOwnerRecord,
  communityTokenOwnerRecord,
}: {
  councilTokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined;
  communityTokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined;
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
      {communityTokenOwnerRecord && (
        <span>
          {`tokens: ${formatTokenAmount(
            communityMint,
            communityTokenOwnerRecord.info.governingTokenDepositAmount,
          )}`}
        </span>
      )}
      {communityTokenOwnerRecord && councilTokenOwnerRecord && ' | '}
      {councilTokenOwnerRecord && (
        <span>
          {`council tokens: ${formatTokenAmount(
            councilMint,
            councilTokenOwnerRecord.info.governingTokenDepositAmount,
          )}`}
        </span>
      )}
    </>
  );
}

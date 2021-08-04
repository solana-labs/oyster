import React, { useEffect, useState } from 'react';
import { Governance } from '../../../models/accounts';
import {
  deserializeMint,
  ParsedAccount,
  useAccount,
  useConnection,
  contexts,
} from '@oyster/common';

import { MintInfo } from '@solana/spl-token';
import { formatMintNaturalAmountAsDecimal } from '../../../tools/units';
const { useMint } = contexts.Accounts;

export default function AccountDescription({
  governance,
}: {
  governance: ParsedAccount<Governance>;
}) {
  const connection = useConnection();
  const [mintAccount, setMintAccount] = useState<MintInfo | null>();

  const tokenAccount = useAccount(governance.info.governedAccount);
  const tokenAccountMint = useMint(tokenAccount?.info.mint);

  useEffect(() => {
    if (!governance.info.isMintGovernance()) {
      return;
    }
    connection
      .getAccountInfo(governance.info.governedAccount)
      .then(info => info && deserializeMint(info.data))
      .then(setMintAccount);
  }, [connection, governance]);

  return (
    <>
      {governance.info.isTokenGovernance() &&
        tokenAccount &&
        tokenAccountMint &&
        `Token Balance: ${formatMintNaturalAmountAsDecimal(
          tokenAccountMint,
          tokenAccount.info.amount,
        )}`}
      {mintAccount &&
        `Mint Supply: ${formatMintNaturalAmountAsDecimal(
          mintAccount,
          mintAccount.supply,
        )}`}
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { Governance } from '../../models/accounts';
import {
  deserializeMint,
  ParsedAccount,
  useAccount,
  useConnection,
} from '@oyster/common';

import { MintInfo } from '@solana/spl-token';

export default function AccountDescription({
  governance,
}: {
  governance: ParsedAccount<Governance>;
}) {
  const connection = useConnection();
  const [mintAccount, setMintAccount] = useState<MintInfo | null>();

  const tokenAccount = useAccount(governance.info.governedAccount);

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
        `Token Balance: ${tokenAccount.info.amount}`}
      {mintAccount && `Mint Supply: ${mintAccount.supply}`}
    </>
  );
}

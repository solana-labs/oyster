import React, { useEffect, useState } from 'react';
import { Governance } from '@solana/spl-governance';
import {
  deserializeMint,
  useAccount,
  useConnection,
  contexts,
} from '@oyster/common';

import { MintInfo } from '@solana/spl-token';
import { formatMintNaturalAmountAsDecimal } from '../../../tools/units';
import { useNativeTreasury } from '../../../hooks/apiHooks';
import { Space } from 'antd';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ProgramAccount } from '@solana/spl-governance';
const { useMint } = contexts.Accounts;

export default function AccountDescription({
  governance,
}: {
  governance: ProgramAccount<Governance>;
}) {
  const connection = useConnection();
  const [mintAccount, setMintAccount] = useState<MintInfo | null>();

  const tokenAccount = useAccount(governance.account.governedAccount);
  const tokenAccountMint = useMint(tokenAccount?.info.mint);
  const nativeTreasury = useNativeTreasury(governance?.pubkey);

  useEffect(() => {
    if (!governance.account.isMintGovernance()) {
      return;
    }
    connection
      .getAccountInfo(governance.account.governedAccount)
      .then(info => info && deserializeMint(info.data))
      .then(setMintAccount);
  }, [connection, governance]);

  return (
    <Space size="large">
      {governance.account.isTokenGovernance() &&
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
      {nativeTreasury &&
        `SOL: ${nativeTreasury.account.lamports / LAMPORTS_PER_SOL}`}
    </Space>
  );
}

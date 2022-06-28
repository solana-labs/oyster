import { useCallback, useEffect, useState } from 'react';
import bs58 from 'bs58';
import { Buffer } from 'buffer';
import { RpcContext } from '@solana/spl-governance';
import { AccountInfo, PublicKey } from '@solana/web3.js';

export type DepositedAccountInfo = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};

/**
 * Gets all deposited accounts in vesting program for specified owner wallet
 * @param rpcContext
 * @param vestingProgramId
 * @param ownerPubkey
 *
 * @return null|Account[]   List of related accounts
 */
export const useDepositedAccounts = (
  rpcContext: RpcContext,
  vestingProgramId: PublicKey | undefined,
  ownerPubkey: PublicKey,
) => {
  const [accounts, setAccounts] = useState<DepositedAccountInfo[] | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const fetch = useCallback(async () => {
    if (!rpcContext || !vestingProgramId || !ownerPubkey) return;
    if (isFetching) return;
    setIsFetching(true);

    console.info(`fetching program accounts for ${ownerPubkey.toBase58()}`);

    const programAccounts = await rpcContext.connection.getProgramAccounts(
      vestingProgramId,
      {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode([1].concat(...ownerPubkey.toBytes())),
            },
          },
        ],
      },
    );

    if (programAccounts) {
      setAccounts(programAccounts.map(p => p));
    } else {
      setAccounts(null);
    }
  }, [isFetching, rpcContext, vestingProgramId, ownerPubkey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return accounts;
};

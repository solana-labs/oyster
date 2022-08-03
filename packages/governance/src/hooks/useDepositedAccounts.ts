import { useCallback, useEffect, useState } from 'react';
import bs58 from 'bs58';
import BN from 'bn.js';
import { Buffer } from 'buffer';
import { RpcContext } from '@solana/spl-governance';
import { AccountInfo, PublicKey } from '@solana/web3.js';

export type DepositedAccountInfo = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  balance: BN;
  address: PublicKey;
};

/**
 * Gets all deposited accounts in vesting program for specified owner wallet
 * @param rpcContext
 * @param vestingProgramId
 * @param ownerPubkey
 * @param mint
 *
 * @return null|Account[]   List of related accounts
 */
export const useDepositedAccounts = (
  rpcContext: RpcContext,
  vestingProgramId: PublicKey | undefined,
  ownerPubkey: PublicKey | undefined,
  mint: PublicKey | undefined,
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
      // TODO: potential blockchain rate limit issue, set concurrency or make sequential
      const filledAccounts = await Promise.all(
        programAccounts.map(async p => {
          if (!mint) {
            return null;
          }
          // get address holding that mint token
          const {
            value: addresses,
          } = await rpcContext.connection.getTokenAccountsByOwner(p.pubkey!, {
            mint: mint!,
          });
          const address =
            addresses && addresses.length ? addresses[0].pubkey : null;
          if (!address) return null;
          // get balance of minted token
          const {
            value: tokenBalance,
          } = await rpcContext.connection.getTokenAccountBalance(address);
          // skip empty accounts
          if (tokenBalance.amount === '0') return null;

          return {
            pubkey: p.pubkey,
            account: p.account,
            balance: new BN(tokenBalance.amount),
            address: address,
          } as DepositedAccountInfo;
        }),
      );

      setAccounts(
        filledAccounts.filter(p => p !== null) as DepositedAccountInfo[],
      );
    } else {
      setAccounts(null);
    }
  }, [isFetching, rpcContext, vestingProgramId, ownerPubkey, mint]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return accounts;
};

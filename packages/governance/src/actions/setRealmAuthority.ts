import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Realm } from '@solana/governance-sdk';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { withSetRealmAuthority } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

export const setRealmAuthority = async (
  { connection, wallet, programId }: RpcContext,

  realm: ProgramAccount<Realm>,
  newRealmAuthority: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withSetRealmAuthority(
    instructions,
    programId,
    realm.pubkey,
    realm.account.authority!,
    newRealmAuthority,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Setting realm authority',
    'Realm authority set',
  );
};

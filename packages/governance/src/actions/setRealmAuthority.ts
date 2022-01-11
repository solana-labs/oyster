import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Realm } from '@solana/spl-governance';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { withSetRealmAuthority } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

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

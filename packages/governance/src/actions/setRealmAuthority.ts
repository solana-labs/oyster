import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Realm, SetRealmAuthorityAction } from '@solana/spl-governance';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { withSetRealmAuthority } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const setRealmAuthority = async (
  { connection, wallet, programId, programVersion }: RpcContext,

  realm: ProgramAccount<Realm>,
  newRealmAuthority: PublicKey,
) => {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  withSetRealmAuthority(
    instructions,
    programId,
    programVersion,
    realm.pubkey,
    realm.account.authority!,
    newRealmAuthority,
    SetRealmAuthorityAction.SetChecked,
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

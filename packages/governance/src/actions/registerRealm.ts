import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';

import { Realm } from '../models/governance';

import { withCreateRealm } from '../models/withCreateRealm';

const { notify } = utils;

export const registerRealm = async (
  connection: Connection,
  wallet: any,
  realm: Realm,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  const { realmAddress } = await withCreateRealm(
    instructions,
    realm.name,
    realm.communityMint,
    wallet.publicKey,
  );

  notify({
    message: 'Registering realm...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, []);

    notify({
      message: 'Realm has been crated.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return realmAddress;
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

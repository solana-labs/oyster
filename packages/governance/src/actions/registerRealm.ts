import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';

import { withCreateRealm } from '../models/withCreateRealm';

const { notify } = utils;

export const registerRealm = async (
  connection: Connection,
  wallet: any,
  name: string,
  communityMint: PublicKey,
  councilMint?: PublicKey,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  const { realmAddress } = await withCreateRealm(
    instructions,
    name,
    communityMint,
    wallet.publicKey,
    councilMint,
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
    throw ex;
  }
};

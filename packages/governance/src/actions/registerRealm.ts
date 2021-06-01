import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';

import { GOVERNANCE_SCHEMA, Realm } from '../models/governance';

import { createRealm } from '../models/createRealm';
import { serialize } from 'borsh';

const { notify } = utils;

export const registerRealm = async (
  connection: Connection,
  wallet: any,
  realm: Realm,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  const realm_data = Buffer.from(serialize(GOVERNANCE_SCHEMA, realm));

  const { realmAddress } = await createRealm(
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

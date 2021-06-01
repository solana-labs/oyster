import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';

import {
  CreateAccountGovernanceArgs,
  GovernanceConfig,
  GOVERNANCE_SCHEMA,
  Realm,
} from '../models/governance';

import { createRealm } from '../models/createRealm';
import { serialize } from 'borsh';
import { deserializeBorsh } from '@oyster/common';
import BN from 'bn.js';

const { notify } = utils;

export const registerRealm = async (
  connection: Connection,
  wallet: any,
  realm: Realm,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  const config = new GovernanceConfig({
    realm: new PublicKey('5LuCgmDWyKVb4H57RXiDUBRUEe6YViyh46eWz7jKSgHa'),
    governedAccount: new PublicKey(
      '5LuCgmDWyKVb4H57RXiDUBRUEe6YViyh46eWz7jKSgHa',
    ),
    yesVoteThresholdPercentage: 60,
    minTokensToCreateProposal: 100,
    minInstructionHoldUpTime: new BN(10),
    maxVotingTime: new BN(10),
  });

  const args = new CreateAccountGovernanceArgs({ config });

  const config_data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));
  const config_des = deserializeBorsh(
    GOVERNANCE_SCHEMA,
    CreateAccountGovernanceArgs,
    config_data,
  );

  console.log('CONFIG DATA:', config_des);

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

import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';

const { notify } = utils;

export const registerGovernance = async (
  connection: Connection,
  wallet: any,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAddress = new PublicKey(
    'metaTA73sFPqA8whreUbBsbn3SLJH2vhrW9fP5dmfdC',
  );

  notify({
    message: 'Registering governance...',
    description: 'Please wait...',
    type: 'warn',
  });

  return governanceAddress;

  try {
    let tx = await sendTransaction(connection, wallet, instructions, []);

    notify({
      message: 'Governance has been crated.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return governanceAddress;
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

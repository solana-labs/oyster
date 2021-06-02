import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';

import { withCreateProposal } from '../models/withCreateProposal';

const { notify } = utils;

export const createProposal = async (
  connection: Connection,
  wallet: any,
  realm: PublicKey,
  governance: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  proposalIndex: number,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  const { proposalAddress } = await withCreateProposal(
    instructions,
    realm,
    governance,
    name,
    descriptionLink,
    governingTokenMint,
    wallet.publicKey,
    proposalIndex,
    wallet.publicKey,
  );

  notify({
    message: 'Creating  Proposal...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, []);

    notify({
      message: 'Proposal has been crated.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return proposalAddress;
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

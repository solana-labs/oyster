import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';

import { withCreateProposal } from '../models/withCreateProposal';
import { withAddSignatory } from '../models/withAddSignatory';

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

  let governanceAuthority = wallet.publicKey;
  let signatory = wallet.publicKey;
  let payer = wallet.publicKey;

  const { proposalAddress, tokenOwnerRecordAddress } = await withCreateProposal(
    instructions,
    realm,
    governance,
    name,
    descriptionLink,
    governingTokenMint,
    wallet.publicKey,
    governanceAuthority,
    proposalIndex,
    payer,
  );

  // Add the proposal creator as the default signatory
  await withAddSignatory(
    instructions,
    proposalAddress,
    tokenOwnerRecordAddress,
    governanceAuthority,
    signatory,
    payer,
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

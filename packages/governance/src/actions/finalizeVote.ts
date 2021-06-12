import { Account, Connection, TransactionInstruction } from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';

import { withFinalizeVote } from '../models/withFinalizeVote';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const finalizeVote = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withFinalizeVote(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.governingTokenMint,
  );

  notify({
    message: 'Finalizing vote...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions,
      signers,
      true,
    );

    notify({
      message: 'Vote Finalized',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

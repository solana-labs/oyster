import { Account, Connection, TransactionInstruction } from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';

import { withCancelProposal } from '../models/withCancelProposal';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const cancelProposal = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
) => {
  let governanceAuthority = wallet.publicKey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withCancelProposal(
    instructions,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    governanceAuthority,
  );

  notify({
    message: 'Cancelling proposal...',
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
      message: 'Proposal cancelled.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

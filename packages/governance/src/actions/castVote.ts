import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { SignatoryRecord } from '../models/accounts';
import { withSignOffProposal } from '../models/withSignOffProposal';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const castVote = async (
  connection: Connection,
  wallet: any,
  signatoryRecord: ParsedAccount<SignatoryRecord>,
  signatory: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withSignOffProposal(
    instructions,
    signatoryRecord.info.proposal,
    signatoryRecord.pubkey,
    signatory,
  );

  notify({
    message: 'Signing off proposal...',
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
      message: 'Proposal signed off.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

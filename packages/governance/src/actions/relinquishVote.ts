import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';
import { withRelinquishVote } from '../models/withRelinquishVote';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const relinquishVote = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
  voteRecord: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  // let governanceAuthority = wallet.publicKey;
  // let payer = wallet.publicKey;

  withRelinquishVote(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    proposal.info.governingTokenMint,
    voteRecord,
  );

  notify({
    message: 'Relinquishing vote on proposal...',
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
      message: 'Vote relinquished.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

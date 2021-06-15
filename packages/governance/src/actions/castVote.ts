import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote } from '../models/instructions';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const castVote = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  vote: Vote,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = wallet.publicKey;
  let payer = wallet.publicKey;

  await withCastVote(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    tokeOwnerRecord,
    governanceAuthority,
    proposal.info.governingTokenMint,
    vote,
    payer,
  );

  notify({
    message: 'Voting on proposal...',
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
      message: 'Proposal voted on.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
  }
};

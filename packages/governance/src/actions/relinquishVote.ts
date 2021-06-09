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
  IsWithdrawal: boolean,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = wallet.publicKey;
  let beneficiary = wallet.publicKey;

  withRelinquishVote(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    proposal.info.governingTokenMint,
    voteRecord,
    governanceAuthority,
    beneficiary,
  );

  notify({
    message: IsWithdrawal
      ? 'Withdrawing vote from proposal...'
      : 'Releasing voting tokens...',
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
      message: IsWithdrawal ? 'Vote withdrawn' : 'Tokens released',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

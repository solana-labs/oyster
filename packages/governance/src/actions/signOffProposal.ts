import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { SignatoryRecord } from '../models/accounts';
import { withSignOffProposal } from '../models/withSignOffProposal';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/api';

export const signOffProposal = async (
  { connection, wallet, programId }: RpcContext,

  signatoryRecord: ParsedAccount<SignatoryRecord>,
  signatory: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withSignOffProposal(
    instructions,
    programId,
    signatoryRecord.info.proposal,
    signatoryRecord.pubkey,
    signatory,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Signing off proposal',
    'Proposal signed off',
  );
};

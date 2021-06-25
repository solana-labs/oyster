import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { SignatoryRecord } from '../models/accounts';
import { withSignOffProposal } from '../models/withSignOffProposal';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const signOffProposal = async (
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

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Signing off proposal',
    'Proposal signed off',
  );
};

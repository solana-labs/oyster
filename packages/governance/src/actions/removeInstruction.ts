import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';

import { withRemoveInstruction } from '../models/withRemoveInstruction';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const removeInstruction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
  proposalInstruction: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const governanceAuthority = wallet.publicKey;
  const beneficiary = wallet.publicKey;

  await withRemoveInstruction(
    instructions,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    governanceAuthority,
    proposalInstruction,
    beneficiary,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Removing instruction',
    'Instruction removed',
  );
};

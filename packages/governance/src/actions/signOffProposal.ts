import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { SignatoryRecord } from '@solana/governance-sdk';
import { withSignOffProposal } from '@solana/governance-sdk';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

export const signOffProposal = async (
  { connection, wallet, programId }: RpcContext,

  signatoryRecord: ProgramAccount<SignatoryRecord>,
  signatory: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withSignOffProposal(
    instructions,
    programId,
    signatoryRecord.account.proposal,
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

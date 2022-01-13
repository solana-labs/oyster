import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { SignatoryRecord } from '@solana/spl-governance';
import { withSignOffProposal } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const signOffProposal = async (
  { connection, wallet, programId }: RpcContext,

  signatoryRecord: ProgramAccount<SignatoryRecord>,
  signatory: PublicKey,
) => {
  let signers: Keypair[] = [];
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

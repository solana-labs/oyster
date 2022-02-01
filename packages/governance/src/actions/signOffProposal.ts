import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal, SignatoryRecord } from '@solana/spl-governance';
import { withSignOffProposal } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const signOffProposal = async (
  { connection, wallet, programId, programVersion }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>,
  signatoryRecord: ProgramAccount<SignatoryRecord>,
  signatory: PublicKey,
) => {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  withSignOffProposal(
    instructions,
    programId,
    programVersion,
    realm,
    proposal.account.governance,
    signatoryRecord.account.proposal,
    signatory,
    signatoryRecord.pubkey,
    undefined,
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

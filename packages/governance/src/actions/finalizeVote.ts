import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { MaxVoterWeightRecord, Proposal } from '@solana/spl-governance';

import { withFinalizeVote } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const finalizeVote = async (
  { connection, wallet, programId, programVersion }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>,
  maxVoterWeightRecord?: ProgramAccount<MaxVoterWeightRecord>,
) => {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  await withFinalizeVote(
    instructions,
    programId,
    programVersion,
    realm,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    proposal.account.governingTokenMint,
    maxVoterWeightRecord?.pubkey,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Finalizing vote',
    'Vote finalized',
  );
};

import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/spl-governance';
import { withCastVote } from '@solana/spl-governance';
import { Vote, YesNoVote } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
  votePercentage: number,
  voterWeightRecord?: PublicKey,
  maxVoterWeightRecord?: PublicKey,
  communityVoterWeightAddin?: PublicKey,
) => {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  await withCastVote(
    instructions,
    programId,
    programVersion,
    realm,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    tokenOwnerRecord,
    governanceAuthority,
    proposal.account.governingTokenMint,
    Vote.fromYesNoVote(yesNoVote),
    votePercentage,
    payer,
    voterWeightRecord,
    maxVoterWeightRecord,
    communityVoterWeightAddin,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Voting on proposal',
    'Proposal voted on',
  );
};

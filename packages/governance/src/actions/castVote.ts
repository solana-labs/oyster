import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Governance, Proposal, Realm } from '@solana/spl-governance';
import { withCastVote } from '@solana/spl-governance';
import { Vote, YesNoVote } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

type Props = {
  rpcContext: RpcContext;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  proposal: ProgramAccount<Proposal>;
  tokenOwnerRecord: PublicKey;
  vote: YesNoVote;
  votePercentage: number;
  voterWeightRecord?: PublicKey;
  maxVoterWeightRecord?: PublicKey;
  communityVoterWeightAddin?: PublicKey;
};

export const castVote = async ({
  rpcContext,
  realm,
  governance,
  proposal,
  tokenOwnerRecord,
  vote,
  votePercentage,
  voterWeightRecord,
  maxVoterWeightRecord,
  communityVoterWeightAddin,
}: Props) => {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];
  const {
    connection,
    wallet,
    programId,
    programVersion,
    walletPubkey,
  } = rpcContext;

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  await withCastVote(
    instructions,
    programId,
    programVersion,
    governance.account.realm,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    tokenOwnerRecord,
    governanceAuthority,
    proposal.account.governingTokenMint,
    realm.account.communityMint,
    realm.pubkey,
    Vote.fromYesNoVote(vote),
    votePercentage,
    payer,
    voterWeightRecord,
    maxVoterWeightRecord,
    communityVoterWeightAddin,
  );

  try {
    /*
     * Should catch this error for the particular case:
     * user sign a transaction after voting time ended
     * ISSUE - NDEV-1033
     */
    await sendTransactionWithNotifications(
      connection,
      wallet,
      instructions,
      signers,
      'Voting on proposal',
      'Proposal voted on',
    );
  } catch (e: unknown) {
    console.error(e);
  }
};

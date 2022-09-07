import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import {
  ProgramAccount,
  Realm,
  RpcContext,
  VOTE_PERCENTAGE_MAX,
  VoteType,
  withAddSignatory,
  withCreateProposal,
  withVotePercentage,
} from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const createProposal = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: ProgramAccount<Realm>,
  governance: PublicKey,
  tokenOwnerRecord: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  proposalIndex: number,
  voterWeightRecord?: PublicKey,
  maxVoterWeightRecord?: PublicKey,
  communityVoterWeightAddin?: PublicKey,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let signatory = walletPubkey;
  let payer = walletPubkey;

  // V2 Approve/Deny configuration
  const voteType = VoteType.SINGLE_CHOICE;
  const options = ['Approve'];
  const useDenyOption = true;

  const proposalAddress = await withCreateProposal(
    instructions,
    programId,
    programVersion,
    realm.pubkey,
    governance,
    tokenOwnerRecord,
    name,
    descriptionLink,
    governingTokenMint,

    governanceAuthority,
    proposalIndex,
    voteType,
    options,
    useDenyOption,
    payer,
    voterWeightRecord,
    maxVoterWeightRecord,
  );

  // NDEV-510: change vote power to 100% before proposal creation
  if (voterWeightRecord && communityVoterWeightAddin) {
    await withVotePercentage(
      instructions,
      programId,
      governingTokenMint,
      realm.pubkey,
      realm.account.communityMint,
      payer,
      voterWeightRecord,
      communityVoterWeightAddin,
      VOTE_PERCENTAGE_MAX,
    );
  }

  // Add the proposal creator as the default signatory
  await withAddSignatory(
    instructions,
    programId,
    programVersion,
    proposalAddress,
    tokenOwnerRecord,
    governanceAuthority,
    signatory,
    payer,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Creating proposal',
    'Proposal has been created',
  );

  return proposalAddress;
};

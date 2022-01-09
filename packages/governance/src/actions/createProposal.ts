import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateProposal } from '@solana/governance-sdk';
import { withAddSignatory } from '@solana/governance-sdk';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { VoteType } from '@solana/governance-sdk';

export const createProposal = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  governance: PublicKey,
  tokenOwnerRecord: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  proposalIndex: number,
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
    realm,
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
  );

  // Add the proposal creator as the default signatory
  await withAddSignatory(
    instructions,
    programId,
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

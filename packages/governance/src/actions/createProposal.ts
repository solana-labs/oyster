import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateProposal } from '../models/withCreateProposal';
import { withAddSignatory } from '../models/withAddSignatory';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/api';

export const createProposal = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  realm: PublicKey,
  governance: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  proposalIndex: number,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let signatory = walletPubkey;
  let payer = walletPubkey;

  const { proposalAddress, tokenOwnerRecordAddress } = await withCreateProposal(
    instructions,
    programId,
    realm,
    governance,
    name,
    descriptionLink,
    governingTokenMint,
    walletPubkey,
    governanceAuthority,
    proposalIndex,
    payer,
  );

  // Add the proposal creator as the default signatory
  await withAddSignatory(
    instructions,
    programId,
    proposalAddress,
    tokenOwnerRecordAddress,
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

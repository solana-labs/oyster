import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateProposal } from '../models/withCreateProposal';
import { withAddSignatory } from '../models/withAddSignatory';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const createProposal = async (
  connection: Connection,
  wallet: any,
  realm: PublicKey,
  governance: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  proposalIndex: number,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = wallet.publicKey;
  let signatory = wallet.publicKey;
  let payer = wallet.publicKey;

  const { proposalAddress, tokenOwnerRecordAddress } = await withCreateProposal(
    instructions,
    realm,
    governance,
    name,
    descriptionLink,
    governingTokenMint,
    wallet.publicKey,
    governanceAuthority,
    proposalIndex,
    payer,
  );

  // Add the proposal creator as the default signatory
  await withAddSignatory(
    instructions,
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

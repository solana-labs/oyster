import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/governance-sdk';
import { withCastVote } from '@solana/governance-sdk';
import { Vote, YesNoVote } from '@solana/governance-sdk';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  yesNoVote: YesNoVote,
) => {
  let signers: Account[] = [];
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
    tokeOwnerRecord,
    governanceAuthority,
    proposal.account.governingTokenMint,
    Vote.fromYesNoVote(yesNoVote),
    payer,
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

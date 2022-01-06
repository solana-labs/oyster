import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote, YesNoVote } from '../models/instructions';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ProgramAccount } from '../models/tools/solanaSdk';

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

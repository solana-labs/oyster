import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/spl-governance';

import { withFlagTransactionError } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const flagInstructionError = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  proposalInstruction: PublicKey,
) => {
  let governanceAuthority = walletPubkey;

  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  withFlagTransactionError(
    instructions,
    programId,
    programVersion,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    governanceAuthority,
    proposalInstruction,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Flagging instruction as broken',
    'Instruction flagged as broken',
  );
};

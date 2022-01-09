import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/governance-sdk';

import { withFlagInstructionError } from '@solana/governance-sdk';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

export const flagInstructionError = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  proposalInstruction: PublicKey,
) => {
  let governanceAuthority = walletPubkey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withFlagInstructionError(
    instructions,
    programId,
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

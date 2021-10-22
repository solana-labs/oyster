import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { InstructionData, Proposal } from '../models/accounts';

import { withInsertInstruction } from '../models/withInsertInstruction';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

export const insertInstruction = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  index: number,
  holdUpTime: number,
  instructionData: InstructionData,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const governanceAuthority = walletPubkey;
  const payer = walletPubkey;

  const proposalInstructionAddress = await withInsertInstruction(
    instructions,
    programId,
    proposal.info.governance,
    proposal.pubkey,
    tokenOwnerRecord,
    governanceAuthority,
    index,
    holdUpTime,
    instructionData,
    payer,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Adding instruction',
    'Instruction added',
  );

  return proposalInstructionAddress;
};

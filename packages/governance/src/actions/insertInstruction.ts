import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount, deserializeBorsh } from '@oyster/common';

import { InstructionData, Proposal } from '../models/accounts';

import { withInsertInstruction } from '../models/withInsertInstruction';
import { GOVERNANCE_SCHEMA } from '../models/serialisation';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/api';

export const insertInstruction = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  index: number,
  holdUpTime: number,
  instructionDataBase64: string,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const governanceAuthority = walletPubkey;
  const payer = walletPubkey;

  const instructionDataBin = Buffer.from(instructionDataBase64, 'base64');
  const instructionData: InstructionData = deserializeBorsh(
    GOVERNANCE_SCHEMA,
    InstructionData,
    instructionDataBin,
  );

  await withInsertInstruction(
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
};

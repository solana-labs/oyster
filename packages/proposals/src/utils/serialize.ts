import { ParsedAccount, utils } from '@oyster/common';
import {
  Connection,
  TransactionInstruction,
  Transaction,
  PublicKey,
  Message,
} from '@solana/web3.js';
import { GOVERNANCE_AUTHORITY_SEED, TimelockSet } from '../models/timelock';
export async function serializeInstruction({
  connection,
  instr,
  proposal,
}: {
  connection: Connection;
  instr: TransactionInstruction;
  proposal: ParsedAccount<TimelockSet>;
}): Promise<{ base64: string; byteArray: Uint8Array }> {
  const PROGRAM_IDS = utils.programIds();
  let instructionTransaction = new Transaction();
  instructionTransaction.add(instr);
  instructionTransaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash;
  const [authority] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_AUTHORITY_SEED), proposal.pubkey.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );
  instructionTransaction.setSigners(authority);
  const msg: Message = instructionTransaction.compileMessage();

  let binary_string = atob(msg.serialize().toString('base64'));
  let len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return {
    base64: msg.serialize().toString('base64'),
    byteArray: bytes,
  };
}

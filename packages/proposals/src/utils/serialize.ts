import { utils } from '@oyster/common';
import {
  Connection,
  TransactionInstruction,
  Transaction,
  PublicKey,
  Message,
} from '@solana/web3.js';
export async function serializeInstruction({
  connection,
  instr,
}: {
  connection: Connection;
  instr: TransactionInstruction;
}): Promise<{ base64: string; byteArray: Uint8Array }> {
  const PROGRAM_IDS = utils.programIds();
  let instructionTransaction = new Transaction();
  instructionTransaction.add(instr);
  instructionTransaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash;
  const [authority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
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

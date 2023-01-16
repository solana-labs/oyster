import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { withRevokeGoverningTokens } from './withRevokeGoverningTokens';

export async function createRevokeGoverningTokens(
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governingTokenOwner: PublicKey,
  governingTokenMint: PublicKey,
  revokeAuthority: PublicKey,
  amount: BN,
) {
  const instructions: TransactionInstruction[] = [];
  await withRevokeGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    governingTokenOwner,
    governingTokenMint,
    revokeAuthority,
    amount,
  );

  return instructions[0];
}

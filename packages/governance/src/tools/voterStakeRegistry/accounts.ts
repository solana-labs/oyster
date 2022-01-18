import { PublicKey } from '@solana/web3.js';

export async function getRegistrarAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
) {
  const [registrarPda, registrarBump] = await PublicKey.findProgramAddress(
    [realm.toBuffer(), Buffer.from('registrar'), governingTokenMint.toBuffer()],
    programId,
  );

  return { registrarPda, registrarBump };
}

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

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

export const unusedMintPk = new PublicKey('11111111111111111111111111111111');

export interface votingMint {
  depositScaledFactor: BN;
  digitShift: number;
  grantAuthority: PublicKey;
  lockupSaturationSecs: BN;
  lockupScaledFactor: BN;
  mint: PublicKey;
}

export type LockupType = 'none' | 'monthly' | 'cliff' | 'constant' | 'daily'; //there is also daily type but not used on ui yet
export interface Registrar {
  governanceProgramId: PublicKey;
  realm: PublicKey;
  realmAuthority: PublicKey;
  realmGoverningTokenMint: PublicKey;
  votingMints: votingMint[];
  //there are more fields but no use for them on ui yet
}

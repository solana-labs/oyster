import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SetRealmAuthorityAction } from './instructions';
import { withSetRealmAuthority } from './withSetRealmAuthority';

export function createSetRealmAuthority(
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  realmAuthority: PublicKey,
  newRealmAuthority: PublicKey | undefined,
  action: SetRealmAuthorityAction | undefined,
) {
  const instructions: TransactionInstruction[] = [];

  withSetRealmAuthority(
    instructions,
    programId,
    programVersion,
    realm,
    realmAuthority,
    newRealmAuthority,
    action,
  );

  return instructions[0];
}

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { SetRealmAuthorityArgs } from './instructions';
import { PROGRAM_VERSION_V1 } from '../registry';

export const withSetRealmAuthority = (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  realmAuthority: PublicKey,
  newRealmAuthority: PublicKey | undefined,
) => {
  const args = new SetRealmAuthorityArgs({
    newRealmAuthority: newRealmAuthority, // V1
    removeAuthority: newRealmAuthority == undefined, // V2
  });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  let keys = [
    {
      pubkey: realm,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: realmAuthority,
      isWritable: false,
      isSigner: true,
    },
  ];

  if (programVersion > PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: newRealmAuthority!,
      isWritable: false,
      isSigner: false,
    });
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};

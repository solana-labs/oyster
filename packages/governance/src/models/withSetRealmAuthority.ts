import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { SetRealmAuthority } from './instructions';

export const withSetRealmAuthority = (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  realm: PublicKey,
  realmAuthority: PublicKey,
  newRealmAuthority: PublicKey,
) => {
  const args = new SetRealmAuthority({ newRealmAuthority });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const keys = [
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

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};

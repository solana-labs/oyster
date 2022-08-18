import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { RevokeGoverningTokensArgs } from './instructions';
import {
  getGoverningTokenHoldingAddress,
  getRealmConfigAddress,
  getTokenOwnerRecordAddress,
} from './accounts';
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID } from '../tools/sdk/splToken';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

export const withRevokeGoverningTokens = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  realmAuthority: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
  amount: BN,
) => {
  const args = new RevokeGoverningTokensArgs({ amount });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  const tokenOwnerRecordAddress = await getTokenOwnerRecordAddress(
    programId,
    realm,
    governingTokenMint,
    governingTokenOwner,
  );

  const governingTokenHoldingAddress = await getGoverningTokenHoldingAddress(
    programId,
    realm,
    governingTokenMint,
  );

  const realmConfigAddress = await getRealmConfigAddress(programId, realm);

  const keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: realmAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: governingTokenHoldingAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecordAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: realmConfigAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSVAR_RENT_PUBKEY,
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

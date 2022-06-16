import {
  AccountMeta,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { DepositGoverningTokensArgs } from './instructions';
import {
  getTokenOwnerRecordAddress,
  GOVERNANCE_PROGRAM_SEED,
} from './accounts';
import BN from 'bn.js';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { TOKEN_PROGRAM_ID } from '../tools/sdk/splToken';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

const shortMeta = (
  pubkey: PublicKey,
  isWriteble = false,
  isSigner = false,
): AccountMeta => {
  return {
    pubkey: pubkey,
    isSigner: isSigner,
    isWritable: isWriteble,
  };
};

export const withDepositGoverningTokens = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governingTokenSource: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
  transferAuthority: PublicKey,
  payer: PublicKey,
  amount: BN,
) => {
  const args = new DepositGoverningTokensArgs({ amount, release_time: 0 });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  const tokenOwnerRecordAddress = await getTokenOwnerRecordAddress(
    programId,
    realm,
    governingTokenMint,
    governingTokenOwner,
  );

  const [governingTokenHoldingAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
    ],
    programId,
  );

  // According to schema https://github.com/neonlabsorg/neon-spl-governance/blob/main/addin-vesting/program/src/instruction.rs#L21-L44
  const keys = [
    shortMeta(SYSTEM_PROGRAM_ID), // The system program account
    shortMeta(TOKEN_PROGRAM_ID), // The spl-token program account
    shortMeta(governingTokenHoldingAddress, true), // The vesting account. PDA seeds: [vesting spl-token account]
    shortMeta(transferAuthority, true), // The vesting spl-token account
    shortMeta(governingTokenOwner, false, true), // The source spl-token account owner
    shortMeta(governingTokenSource, true), // The source spl-token account
    shortMeta(tokenOwnerRecordAddress), // The Vesting Owner account
    shortMeta(realm), // Realm
    shortMeta(payer, false, true), // Payer
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

  return tokenOwnerRecordAddress;
};

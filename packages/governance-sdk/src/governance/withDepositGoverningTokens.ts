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
import { shortMeta } from '../tools';

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
    // 0. `[]` The system program account
    shortMeta(SYSTEM_PROGRAM_ID),
    // 1. `[]` The spl-token program account
    shortMeta(TOKEN_PROGRAM_ID),
    // 2. `[writable]` The vesting account. PDA seeds: [vesting spl-token account]
    shortMeta(governingTokenHoldingAddress, true),
    // 3. `[writable]` The vesting spl-token account TODO: check
    shortMeta(transferAuthority, true),
    // 4. `[signer]` The source spl-token account owner
    shortMeta(governingTokenOwner, false, true),
    // 5. `[writable]` The source spl-token account
    shortMeta(governingTokenSource, true),
    // 6. `[]` The Vesting Owner account
    shortMeta(tokenOwnerRecordAddress),
    // 7. `[signer]` Payer
    shortMeta(payer, false, true),
    // 8. `[]` The Governance program account
    shortMeta(programId),
    // 9. `[]` The Realm account
    shortMeta(realm),
    // 10. `[writable]` The VoterWeightRecord. PDA seeds: ['voter_weight', realm, token_mint, token_owner]
    // 11. `[writable]` The MaxVoterWeightRecord. PDA seeds: ['max_voter_weight', realm, token_mint]
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

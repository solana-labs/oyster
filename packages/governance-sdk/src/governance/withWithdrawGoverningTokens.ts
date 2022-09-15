import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { WithdrawGoverningTokensArgs } from './instructions';
import { GOVERNANCE_PROGRAM_SEED } from './accounts';
import { shortMeta, TOKEN_PROGRAM_ID } from '../tools';

export const withWithdrawGoverningTokens = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  realm: PublicKey,
  governingTokenDestination: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
  vestingProgramId?: PublicKey,
  voterWeightRecord?: PublicKey,
  maxVoterWeightRecord?: PublicKey,
  vestingTokenAddress?: PublicKey,
  vestingTokenAccount?: PublicKey,
) => {
  const args = new WithdrawGoverningTokensArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
      governingTokenOwner.toBuffer(),
    ],
    programId,
  );

  // According to schema https://github.com/neonlabsorg/neon-spl-governance/blob/main/addin-vesting/program/src/instruction.rs#L47-L62
  const keys = [
    // 0. `[]` The spl-token program account
    shortMeta(TOKEN_PROGRAM_ID),
    // 1. `[writable]` The vesting account. PDA seeds: [vesting spl-token account]
    shortMeta(vestingTokenAccount!, true),
    // 2. `[writable]` The vesting spl-token account
    shortMeta(vestingTokenAddress!, true),
    // 3. `[writable]` The destination spl-token account
    shortMeta(governingTokenDestination, true),
    // 4. `[signer]` The Vesting Owner account
    // + writable
    shortMeta(governingTokenOwner, true, true),
    // 5. `[]` The Governance program account
    shortMeta(programId),
    // 6. `[]` The Realm account
    shortMeta(realm),
    // 7. `[]` Governing Owner Record. PDA seeds (governance program): ['governance', realm, token_mint, vesting_owner]
    shortMeta(tokenOwnerRecordAddress),
    // 8. `[writable]` The VoterWeightRecord. PDA seeds: ['voter_weight', realm, token_mint, vesting_owner]
    shortMeta(voterWeightRecord!, true),
    // 9. `[writable]` The MaxVoterWeightRecord. PDA seeds: ['max_voter_weight', realm, token_mint]
    shortMeta(maxVoterWeightRecord!, true),
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: vestingProgramId || programId,
      data,
    }),
  );
};

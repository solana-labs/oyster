import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { AccountLayout, Token } from '@solana/spl-token';
import { serialize } from 'borsh';
import BN from 'bn.js';
import { getGovernanceSchema } from './serialisation';
import {
  DepositGoverningTokensArgs,
  DepositGoverningTokensMultiArgs,
} from './instructions';
import {
  getTokenOwnerRecordAddress,
  GOVERNANCE_PROGRAM_SEED,
} from './accounts';
import { shortMeta, SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../tools';
import { PROGRAM_VERSION_V1 } from '../registry';

/**
 * Instructions to create and initialise vesting spl-token account
 * ref:https://github.com/neonlabsorg/neon-spl-governance/blob/f13d7e7c1507819306797688ce0bb1f6950a5038/addin-vesting/cli/src/main.rs#L58-L82
 */
export async function createVestingAccount(
  instructions: TransactionInstruction[],
  vestingProgramId: PublicKey,
  governingTokenMint: PublicKey,
  payer: PublicKey,
  amount: number,
) {
  const vestingTokenKeypair = Keypair.generate();
  const vestingTokenPubkey = vestingTokenKeypair.publicKey;
  const [vestingPubkey] = await PublicKey.findProgramAddress(
    [vestingTokenPubkey.toBuffer()],
    vestingProgramId,
  );

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: vestingTokenPubkey,
      lamports: amount,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  instructions.push(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      governingTokenMint,
      vestingTokenPubkey,
      vestingPubkey,
    ),
  );

  return { vestingTokenPubkey, vestingPubkey, vestingTokenKeypair };
}

export async function withDepositGoverningTokens(
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governingTokenSource: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
  payer: PublicKey,
  amount: BN,
  vestingProgramId?: PublicKey,
  voterWeightRecord?: PublicKey,
  maxVoterWeightRecord?: PublicKey,
  vestingTokenPubkey?: PublicKey,
  vestingPubkey?: PublicKey,
) {
  let data;

  if (!vestingProgramId) {
    // obsolete governance workflow
    data = Buffer.from(
      serialize(
        getGovernanceSchema(programVersion),
        new DepositGoverningTokensArgs({ amount }),
      ),
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

    vestingTokenPubkey = tokenOwnerRecordAddress;
    vestingPubkey = governingTokenHoldingAddress;
  } else {
    // generate correct deposit payload
    data = Buffer.from(
      serialize(
        getGovernanceSchema(programVersion),
        new DepositGoverningTokensMultiArgs([{ amount, release_time: 0 }]),
      ),
    );
  }

  // According to schema https://github.com/neonlabsorg/neon-spl-governance/blob/main/addin-vesting/program/src/instruction.rs#L21-L44
  const keys = [
    // 0. `[]` The system program account
    shortMeta(SYSTEM_PROGRAM_ID),
    // 1. `[]` The spl-token program account
    shortMeta(TOKEN_PROGRAM_ID),
    // 2. `[writable]` The vesting account. PDA seeds: [vesting spl-token account]
    shortMeta(vestingPubkey!, true),
    // 3. `[writable]` The vesting spl-token account
    // + signer, it's new account
    shortMeta(vestingTokenPubkey!, true, true),
    // 4. `[signer]` The source spl-token account owner
    // + writable
    shortMeta(governingTokenOwner, true, true),
    // 5. `[writable]` The source spl-token account
    shortMeta(governingTokenSource, true),

    // 6. `[]` The Vesting Owner account
    // 💛 = 4
    //shortMeta(tokenOwnerRecordAddress),
    shortMeta(governingTokenOwner),
    // 7. `[signer]` Payer
    // 💛 = 4
    //shortMeta(payer, false, true),
    // + writable
    shortMeta(payer, true, true),
    // 8. `[]` The Governance program account
    // shortMeta(programId),
    // 9. `[]` The Realm account
    shortMeta(realm),
    // 10. `[writable]` The VoterWeightRecord. PDA seeds: ['voter_weight', realm, token_mint, token_owner]
    shortMeta(voterWeightRecord!, true),
    // 11. `[writable]` The MaxVoterWeightRecord. PDA seeds: ['max_voter_weight', realm, token_mint]
    shortMeta(maxVoterWeightRecord!, true),
  ];

  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    });
  }

  instructions.push(
    new TransactionInstruction({ programId: vestingProgramId!, keys, data }),
  );

  return vestingTokenPubkey;
}

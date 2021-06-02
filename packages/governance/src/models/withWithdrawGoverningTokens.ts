import { utils } from '@oyster/common';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GOVERNANCE_PROGRAM_SEED, GOVERNANCE_SCHEMA } from './governance';
import { serialize } from 'borsh';
import { WithdrawGoverningTokensArgs } from './instructions';

export const withWithdrawGoverningTokens = async (
  instructions: TransactionInstruction[],
  realm: PublicKey,
  governingTokenDestination: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  const args = new WithdrawGoverningTokensArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
      governingTokenOwner.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  const [governingTokenHoldingAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  const keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governingTokenHoldingAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenDestination,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenOwner,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: tokenOwnerRecordAddress,
      isWritable: true,
      isSigner: false,
    },

    {
      pubkey: PROGRAM_IDS.token,
      isWritable: false,
      isSigner: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );
};

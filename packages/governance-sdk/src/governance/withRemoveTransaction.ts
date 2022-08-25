import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GOVERNANCE_INSTRUCTION_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { RemoveTransactionArgs } from './instructions';

export const withRemoveTransaction = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  proposalTransaction: PublicKey,
  beneficiary: PublicKey,
) => {
  const args = new RemoveTransactionArgs();
  const data = Buffer.from(serialize(GOVERNANCE_INSTRUCTION_SCHEMA, args));

  const keys = [
    {
      pubkey: proposal,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: proposalTransaction,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: beneficiary,
      isWritable: true,
      isSigner: false,
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

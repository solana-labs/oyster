import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_INSTRUCTION_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { ExecuteTransactionArgs } from './instructions';
import {
  AccountMetaData,
  getNativeTreasuryAddress,
  InstructionData,
} from './accounts';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

export const withExecuteTransaction = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  governance: PublicKey,
  proposal: PublicKey,
  transactionAddress: PublicKey,
  transactionInstructions: InstructionData[],
) => {
  const args = new ExecuteTransactionArgs();
  const data = Buffer.from(serialize(GOVERNANCE_INSTRUCTION_SCHEMA, args));

  const nativeTreasury = await getNativeTreasuryAddress(programId, governance);

  let keys = [
    {
      pubkey: governance,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: proposal,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: transactionAddress,
      isWritable: true,
      isSigner: false,
    },
  ];
  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    });
  }

  for (let instruction of transactionInstructions) {
    // When an instruction needs to be signed by the Governance PDA or the Native treasury then its isSigner flag has to be reset on AccountMeta
    // because the signature will be required during cpi call invoke_signed() and not when we send ExecuteInstruction
    instruction.accounts = instruction.accounts.map(a =>
      (a.pubkey.toBase58() === governance.toBase58() ||
        a.pubkey.toBase58() === nativeTreasury.toBase58()) &&
      a.isSigner
        ? new AccountMetaData({
            pubkey: a.pubkey,
            isWritable: a.isWritable,
            isSigner: false,
          })
        : a,
    );

    keys.push(
      {
        pubkey: instruction.programId,
        isWritable: false,
        isSigner: false,
      },
      ...instruction.accounts,
    );
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GovernanceConfig } from './accounts';
import { SetGovernanceConfigArgs } from './instructions';
import { getGovernanceInstructionSchema } from './serialisation';
import { serialize } from 'borsh';

export function createSetGovernanceConfig(
  programId: PublicKey,
  programVersion: number,
  governance: PublicKey,
  governanceConfig: GovernanceConfig,
) {
  const args = new SetGovernanceConfigArgs({ config: governanceConfig });
  const data = Buffer.from(
    serialize(getGovernanceInstructionSchema(programVersion), args),
  );

  const keys = [
    {
      pubkey: governance,
      isWritable: true,
      isSigner: true,
    },
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}

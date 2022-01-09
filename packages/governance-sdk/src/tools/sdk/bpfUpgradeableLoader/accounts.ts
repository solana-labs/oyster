import { Connection, PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';
import { BPF_UPGRADE_LOADER_ID } from '../../solanaSdk';

// Copied from Explorer code https://github.com/solana-labs/solana/blob/master/explorer/src/validators/accounts/upgradeable-program.ts
import { type, number, nullable, Infer } from 'superstruct';
import { coerce, instance, string } from 'superstruct';

export const PublicKeyFromString = coerce(
  instance(PublicKey),
  string(),
  value => new PublicKey(value),
);

export type ProgramDataAccountInfo = Infer<typeof ProgramDataAccountInfo>;
export const ProgramDataAccountInfo = type({
  authority: nullable(PublicKeyFromString),
  // don't care about data yet
  slot: number(),
});

export async function getProgramDataAddress(programId: PublicKey) {
  const [programDataAddress] = await PublicKey.findProgramAddress(
    [programId.toBuffer()],
    BPF_UPGRADE_LOADER_ID,
  );

  return programDataAddress;
}

export async function getProgramDataAccount(
  connection: Connection,
  programId: PublicKey,
) {
  const programDataAddress = await getProgramDataAddress(programId);
  const account = await connection.getParsedAccountInfo(programDataAddress);

  if (!account || !account.value) {
    throw new Error(
      `Program data account ${programDataAddress.toBase58()} for program ${programId.toBase58()} not found`,
    );
  }

  const accountInfo = account.value;

  if (
    !(
      'parsed' in accountInfo.data &&
      accountInfo.data.program === 'bpf-upgradeable-loader'
    )
  ) {
    throw new Error(
      `Invalid program data account ${programDataAddress.toBase58()} for program ${programId.toBase58()}`,
    );
  }

  let programData = create(
    accountInfo.data.parsed.info,
    ProgramDataAccountInfo,
  );
  return programData;
}

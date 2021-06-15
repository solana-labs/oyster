import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';

export async function createUpgradeInstruction(
  programId: PublicKey,
  bufferAddress: PublicKey,
  governance: PublicKey,
) {
  const PROGRAM_IDS = utils.programIds();

  const [programDataAddress] = await PublicKey.findProgramAddress(
    [programId.toBuffer()],
    PROGRAM_IDS.bpf_upgrade_loader,
  );

  const keys = [
    {
      pubkey: programDataAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: programId,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: bufferAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: false,
      isSigner: true,
    },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.bpf_upgrade_loader,
    data: Buffer.from([3, 0, 0, 0]), // Upgrade instruction bincode
  });
}

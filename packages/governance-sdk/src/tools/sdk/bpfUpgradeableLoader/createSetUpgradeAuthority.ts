import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BPF_UPGRADE_LOADER_ID } from '../../solanaSdk';

export async function createSetUpgradeAuthority(
  programId: PublicKey,
  upgradeAuthority: PublicKey,
  newUpgradeAuthority: PublicKey,
) {
  const [programDataAddress] = await PublicKey.findProgramAddress(
    [programId.toBuffer()],
    BPF_UPGRADE_LOADER_ID,
  );

  const keys = [
    {
      pubkey: programDataAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: upgradeAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: newUpgradeAuthority,
      isWritable: false,
      isSigner: false,
    },
  ];

  return new TransactionInstruction({
    keys,
    programId: BPF_UPGRADE_LOADER_ID,
    data: Buffer.from([4, 0, 0, 0]), // SetAuthority instruction bincode
  });
}

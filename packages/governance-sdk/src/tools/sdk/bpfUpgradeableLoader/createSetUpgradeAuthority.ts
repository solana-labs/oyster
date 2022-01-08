import { utils } from '@oyster/common';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export async function createSetUpgradeAuthority(
  programId: PublicKey,
  upgradeAuthority: PublicKey,
  newUpgradeAuthority: PublicKey,
) {
  const { bpf_upgrade_loader: bpfUpgradableLoaderId } = utils.programIds();

  const [programDataAddress] = await PublicKey.findProgramAddress(
    [programId.toBuffer()],
    bpfUpgradableLoaderId,
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
    programId: bpfUpgradableLoaderId,
    data: Buffer.from([4, 0, 0, 0]), // SetAuthority instruction bincode
  });
}

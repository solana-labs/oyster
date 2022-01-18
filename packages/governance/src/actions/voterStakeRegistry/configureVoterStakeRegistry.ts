import { VsrClient } from '@blockworks-foundation/voter-stake-registry-client';
import {
  ProgramAccount,
  Realm,
  RpcContext,
  SYSTEM_PROGRAM_ID,
} from '@solana/spl-governance';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { sendTransactionWithNotifications } from '../../tools/transactions';

export async function configureVoterStakeRegistry(
  { connection, wallet, walletPubkey }: RpcContext,
  vsrClient: VsrClient,
  realm: ProgramAccount<Realm>,
  digitShift: number,
  depositScaledFactor: BN,
  lockupScaledFactor: BN,
  lockupSaturationSecs: BN,
) {
  let instructions: TransactionInstruction[] = [];

  const [registrar, registrarBump] = await PublicKey.findProgramAddress(
    [
      realm.pubkey.toBuffer(),
      Buffer.from('registrar'),
      realm.account.communityMint.toBuffer(),
    ],
    vsrClient?.program.programId!,
  );

  instructions.push(
    vsrClient?.program.instruction.createRegistrar(registrarBump, {
      accounts: {
        registrar: registrar,
        governanceProgramId: realm.owner,
        realm: realm.pubkey,
        realmGoverningTokenMint: realm.account.communityMint,
        realmAuthority: realm.account.authority!,
        payer: walletPubkey,
        systemProgram: SYSTEM_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })!,
  );

  instructions.push(
    vsrClient?.program.instruction.configureVotingMint(
      0, // mint index
      digitShift, // digit_shift
      depositScaledFactor, // deposit_scaled_factor
      lockupScaledFactor, // lockup_scaled_factor
      lockupSaturationSecs, // lockup_saturation_secs
      realm.account.authority!,
      {
        accounts: {
          registrar: registrar,
          realmAuthority: realm.account.authority!,
          mint: realm.account.communityMint!,
        },
        remainingAccounts: [
          {
            pubkey: realm.account.communityMint!,
            isSigner: false,
            isWritable: false,
          },
        ],
      },
    )!,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Configuring Voter Stake Registry',
    'Voter Stake Registry Configured',
  );
}

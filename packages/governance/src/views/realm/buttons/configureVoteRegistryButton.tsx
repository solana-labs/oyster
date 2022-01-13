import React from 'react';
import { Realm } from '@solana/spl-governance';

import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import { ProgramAccount } from '@solana/spl-governance';
import { useVoteRegistry } from '../../../hooks/useVoteRegistry';
import { useWallet } from '@oyster/common';
import BN from 'bn.js';

export function ConfigureVoteRegistryButton({
  realm,
}: {
  realm: ProgramAccount<Realm>;
}) {
  const voteRegistryClient = useVoteRegistry();
  const wallet = useWallet();
  const systemProgram = SystemProgram.programId;
  const rent = SYSVAR_RENT_PUBKEY;
  const onSubmit = async () => {
    await setRegistration();

    return null;
  };
  const setRegistration = async () => {
    const [_registrar, _registrarBump] = await PublicKey.findProgramAddress(
      [
        realm.pubkey.toBuffer(),
        Buffer.from('registrar'),
        realm.account.communityMint.toBuffer(),
      ],
      voteRegistryClient?.program.programId!,
    );
    // const props = {
    //   accounts: {
    //     registrar: _registrar,
    //     governanceProgramId: realm.owner,
    //     realm: realm.pubkey,
    //     realmGoverningTokenMint: realm.account.communityMint,
    //     realmAuthority: realm.account.authority!,
    //     payer: wallet.publicKey!,
    //     systemProgram,
    //     rent,
    //   },
    // };

    // await voteRegistryClient?.program.rpc.createRegistrar(
    //   _registrarBump,
    //   props,
    // );
    try {
      await voteRegistryClient?.program.rpc.configureVotingMint(
        0,
        0,
        new BN(1),
        new BN(0),
        new BN(1),
        realm.account.authority!,
        {
          accounts: {
            registrar: _registrar,
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
      );
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <ModalFormAction<null>
      label="Configure Vote Registry"
      formTitle="Configure Vote Registry"
      formAction="Set Configure Vote Registry"
      formPendingAction="Setting Configure Vote Registry"
      onSubmit={onSubmit}
      initialValues={{ useCouncilMint: false }}
    ></ModalFormAction>
  );
}

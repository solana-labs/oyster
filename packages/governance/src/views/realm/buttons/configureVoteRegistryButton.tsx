import React from 'react';
import { Realm } from '@solana/spl-governance';

import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import { ProgramAccount } from '@solana/spl-governance';
import { useVoteRegistry } from '../../../hooks/useVoteRegistry';
import { useWallet } from '@oyster/common';

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
      [realm.pubkey.toBuffer()],
      new PublicKey('4Q6WW2ouZ6V3iaNm56MTd5n2tnTm4C5fiH8miFHnAFHo'),
    );
    const props = {
      accounts: {
        registrar: _registrar,
        governanceProgramId: new PublicKey(realm.owner),
        realm: realm.pubkey,
        realmGoverningTokenMint: realm.account.communityMint,
        realmAuthority: realm.account.authority!,
        payer: wallet.publicKey!,
        systemProgram,
        rent,
      },
    };
    console.log(props);

    await voteRegistryClient?.program.rpc.createRegistrar(
      _registrarBump,
      props,
    );
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
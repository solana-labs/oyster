import { Form, FormInstance } from 'antd';
import { ExplorerLink, useWallet } from '@oyster/common';
import { Governance, Realm, SYSTEM_PROGRAM_ID } from '@solana/spl-governance';
import { SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { ProgramAccount } from '@solana/spl-governance';

import { useRpcContext } from '../../../../../hooks/useRpcContext';
import { formDefaults } from '../../../../../tools/forms';
import { useVoterStakeRegistryClient } from '../../../../../hooks/useVoterStakeRegistryClient';
import { getRegistrarAddress } from '../../../../../tools/voterStakeRegistry/accounts';

export const VoterStakeSetRegistrarForm = ({
  form,
  realm,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const { programId } = useRpcContext();
  const wallet = useWallet();
  const vsrClient = useVoterStakeRegistryClient();

  if (!wallet?.publicKey) {
    return <div>Wallet not connected</div>;
  }

  const onCreate = async () => {
    const { registrarPda, registrarBump } = await getRegistrarAddress(
      vsrClient?.program.programId!,
      realm.pubkey,
      realm.account.communityMint,
    );

    const setRegistrarIx = await vsrClient?.program.instruction.createRegistrar(
      registrarBump,
      {
        accounts: {
          registrar: registrarPda,
          governanceProgramId: realm.owner,
          realm: realm.pubkey,
          realmGoverningTokenMint: realm.account.communityMint,
          realmAuthority: realm.account.authority!,
          payer: wallet.publicKey!,
          systemProgram: SYSTEM_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
      },
    )!;

    onCreateInstruction(setRegistrarIx);
  };

  return (
    <Form {...formDefaults} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink address={programId} type="address" />
      </Form.Item>
      <Form.Item label="realm">
        <ExplorerLink address={realm.pubkey} type="address" />
      </Form.Item>
      <Form.Item label="realm authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
      <Form.Item label="realm community mint">
        <ExplorerLink address={realm.account.communityMint} type="address" />
      </Form.Item>
    </Form>
  );
};

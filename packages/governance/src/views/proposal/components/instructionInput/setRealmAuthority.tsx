import { Form, FormInstance, Select } from 'antd';
import { ExplorerLink, useWallet } from '@oyster/common';
import { Governance, Realm, SetRealmAuthorityAction } from '@solana/spl-governance';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { formDefaults } from '../../../../tools/forms';

import { useRpcContext } from '../../../../hooks/useRpcContext';
import { createSetRealmAuthority } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

import { useGovernancesByRealm } from '../../../../hooks/apiHooks';


export const SetRealmAuthorityForm = ({
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

  const { programId, programVersion } = useRpcContext();
  const wallet = useWallet();

  const governances = useGovernancesByRealm(realm?.pubkey);

  if (!wallet?.publicKey) {
    return <div>Wallet not connected</div>;
  }

  const onCreate = async (
    values: {
      newRealmAuthority: string;
    }
  ) => {

    const newRealmAuthority = new PublicKey(values.newRealmAuthority);

    const setRealmAuthorityIx = createSetRealmAuthority(
      programId,
      programVersion,
      realm.pubkey,
      realm.account.authority!,
      newRealmAuthority,
      SetRealmAuthorityAction.SetChecked
    );

    onCreateInstruction(setRealmAuthorityIx);
  };


  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}

    >
      <Form.Item label="program id">
        <ExplorerLink address={programId} type="address" />
      </Form.Item>
      <Form.Item label="realm">
        <ExplorerLink address={realm.pubkey} type="address" />
      </Form.Item>
      <Form.Item
        name="newRealmAuthority"
        label="new realm authority (governance)"
        rules={[{ required: true }]}
      >
        <Select>
          {governances.filter(g => !g.pubkey.equals(governance.pubkey)).map(g => (
            <Select.Option
              value={g.pubkey.toBase58()}
              key={g.pubkey.toBase58()}
            >
              {g.account.governedAccount.toBase58()}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};

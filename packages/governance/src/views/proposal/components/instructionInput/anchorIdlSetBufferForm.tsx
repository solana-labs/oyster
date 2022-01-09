import { Form, FormInstance } from 'antd';
import { ExplorerLink } from '@oyster/common';
import { Governance } from '@solana/governance-sdk';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { createSetBuffer } from '../../../../tools/anchor/idlInstructions';

import { formDefaults } from '../../../../tools/forms';
import { useAnchorIdlAddress } from '../../../../tools/anchor/anchorHooks';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';
import { ProgramAccount } from '@solana/governance-sdk';

export const AnchorIdlSetBufferForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const idlAddress = useAnchorIdlAddress(governance.account.governedAccount);

  const onCreate = async ({
    idlBufferAddress,
  }: {
    idlBufferAddress: string;
  }) => {
    const upgradeIx = await createSetBuffer(
      governance.account.governedAccount,
      new PublicKey(idlBufferAddress),
      idlAddress!,
      governance.pubkey,
    );

    onCreateInstruction(upgradeIx);
  };

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ idlAccount: idlAddress }}
    >
      <Form.Item label="program id">
        <ExplorerLink
          address={governance.account.governedAccount}
          type="address"
        />
      </Form.Item>

      <AccountFormItem
        name="idlBufferAddress"
        label="idl buffer"
      ></AccountFormItem>

      <Form.Item label="idl account" initialValue={idlAddress}>
        {idlAddress && <ExplorerLink address={idlAddress} type="address" />}
      </Form.Item>

      <Form.Item label="idl authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};

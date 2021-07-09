import { Form, FormInstance, Input } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { createSetBuffer } from '../../../../tools/anchor/idlInstructions';

import { formDefaults } from '../../../../tools/forms';
import { useAnchorIdlAddress } from '../../../../tools/anchor/anchorHooks';

export const AnchorIdlSetBufferForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const idlAddress = useAnchorIdlAddress(
    governance.info.config.governedAccount,
  );

  const onCreate = async ({
    idlBufferAddress,
  }: {
    idlBufferAddress: string;
  }) => {
    const upgradeIx = await createSetBuffer(
      governance.info.config.governedAccount,
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
          address={governance.info.config.governedAccount}
          type="address"
        />
      </Form.Item>

      <Form.Item
        name="idlBufferAddress"
        label="idl buffer"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="idl account" initialValue={idlAddress}>
        {idlAddress && <ExplorerLink address={idlAddress} type="address" />}
      </Form.Item>

      <Form.Item label="idl authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};

import { Form, FormInstance, Input, InputNumber } from 'antd';
import { ExplorerLink, ParsedAccount, utils } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Token } from '@solana/spl-token';
import React from 'react';
import { formDefaults } from '../../../../tools/forms';

export const MintToForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const onCreate = async ({
    destination,
    amount,
  }: {
    destination: string;
    amount: number;
  }) => {
    const { token: tokenProgramId } = utils.programIds();

    const mintToIx = Token.createMintToInstruction(
      tokenProgramId,
      governance.info.config.governedAccount,
      new PublicKey(destination),
      governance.pubkey,
      [],
      amount,
    );

    onCreateInstruction(mintToIx);
  };

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ amount: 1 }}
    >
      <Form.Item label="mint">
        <ExplorerLink
          address={governance.info.config.governedAccount}
          type="address"
        />
      </Form.Item>
      <Form.Item label="mint authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
      <Form.Item
        name="destination"
        label="destination account"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="amount" label="amount" rules={[{ required: true }]}>
        <InputNumber min={1} />
      </Form.Item>
    </Form>
  );
};

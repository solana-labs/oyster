import { Form, FormInstance, Input } from 'antd';
import { ExplorerLink, ParsedAccount, useWallet } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { createUpgradeInstruction } from '../../../../models/sdkInstructions';
import { formDefaults } from '../../../../tools/forms';

export const ProgramUpgradeForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const { wallet } = useWallet();

  if (!wallet?.publicKey) {
    return <div>Wallet not connected</div>;
  }

  const onCreate = async ({ bufferAddress }: { bufferAddress: string }) => {
    const upgradeIx = await createUpgradeInstruction(
      governance.info.config.governedAccount,
      new PublicKey(bufferAddress),
      governance.pubkey,
      wallet.publicKey!,
    );

    onCreateInstruction(upgradeIx);
  };

  return (
    <Form {...formDefaults} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink
          address={governance.info.config.governedAccount}
          type="address"
        />
      </Form.Item>
      <Form.Item label="upgrade authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
      <Form.Item label="spill account (wallet)">
        <ExplorerLink address={wallet.publicKey} type="address" />
      </Form.Item>
      <Form.Item
        name="bufferAddress"
        label="buffer address"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
    </Form>
  );
};

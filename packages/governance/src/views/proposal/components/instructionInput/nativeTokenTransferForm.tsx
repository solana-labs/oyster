import { Form, FormInstance, InputNumber, Spin } from 'antd';
import { ExplorerLink, SYSTEM } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';

import { useNativeTreasury } from '../../../../hooks/apiHooks';
import { lamportsToSOL, SOLToLamports } from '../../../../tools/units';
import { ProgramAccount } from '../../../../models/tools/solanaSdk';

export const NativeTransferForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const nativeTreasury = useNativeTreasury(governance.pubkey);

  if (!nativeTreasury) {
    return <Spin />;
  }

  const onCreate = async ({
    destination,
    solAmount,
  }: {
    destination: string;
    solAmount: string;
  }) => {
    const transferIx = SystemProgram.transfer({
      fromPubkey: nativeTreasury.pubkey,
      toPubkey: new PublicKey(destination),
      lamports: SOLToLamports(parseFloat(solAmount)),
    });

    onCreateInstruction(transferIx);
  };

  const mintAmount = lamportsToSOL(1);
  const maxAmount = lamportsToSOL(nativeTreasury.account.lamports);

  return (
    <Form {...formDefaults} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink address={SYSTEM} type="address" />
      </Form.Item>

      <Form.Item label="source account">
        <ExplorerLink address={nativeTreasury?.pubkey} type="address" />
      </Form.Item>

      <AccountFormItem
        name="destination"
        label="destination account"
      ></AccountFormItem>
      <Form.Item name="solAmount" label="amount" rules={[{ required: true }]}>
        <InputNumber
          min={mintAmount}
          max={maxAmount}
          stringMode
          style={{ width: 200 }}
          step={mintAmount}
        />
      </Form.Item>
    </Form>
  );
};

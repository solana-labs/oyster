import { Form, FormInstance } from 'antd';
import { ExplorerLink, ParsedAccount, useWallet, utils } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import React from 'react';

import { createUpgradeInstruction } from '../../../../models/sdkInstructions';
import { formDefaults } from '../../../../tools/forms';

import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';

import { create } from 'superstruct';
import { ProgramBufferAccount } from '../../../../tools/validators/accounts/upgradeable-program';

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

  const { bpf_upgrade_loader: bpfUpgradableLoaderId } = utils.programIds();

  const onCreate = async ({ bufferAddress }: { bufferAddress: string }) => {
    const upgradeIx = await createUpgradeInstruction(
      governance.info.governedAccount,
      new PublicKey(bufferAddress),
      governance.pubkey,
      wallet.publicKey!,
    );

    onCreateInstruction(upgradeIx);
  };

  const bufferValidator = (info: AccountInfo<Buffer | ParsedAccountData>) => {
    if (
      !('parsed' in info.data && info.data.program === 'bpf-upgradeable-loader')
    ) {
      throw new Error('Invalid program buffer account');
    }

    let buffer: ProgramBufferAccount;

    try {
      buffer = create(info.data.parsed, ProgramBufferAccount);
    } catch {
      throw new Error('Invalid program buffer account');
    }

    if (buffer.info.authority?.toBase58() !== governance.pubkey.toBase58()) {
      throw new Error(
        `Buffer authority must be set to governance account 
          ${governance.pubkey.toBase58()}`,
      );
    }
  };

  return (
    <Form {...formDefaults} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink address={bpfUpgradableLoaderId} type="address" />
      </Form.Item>
      <Form.Item label="program (governed account)">
        <ExplorerLink
          address={governance.info.governedAccount}
          type="address"
        />
      </Form.Item>
      <AccountFormItem
        name="bufferAddress"
        label="buffer address"
        accountInfoValidator={bufferValidator}
      ></AccountFormItem>
      <Form.Item label="spill account (wallet)">
        <ExplorerLink address={wallet.publicKey} type="address" />
      </Form.Item>
      <Form.Item label="upgrade authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};

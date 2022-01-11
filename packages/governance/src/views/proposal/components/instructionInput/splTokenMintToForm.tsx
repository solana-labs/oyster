import { Form, FormInstance, InputNumber, Spin } from 'antd';
import { ExplorerLink, utils } from '@oyster/common';
import { Governance } from '@solana/spl-governance';
import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { Token } from '@solana/spl-token';
import React from 'react';
import { formDefaults } from '../../../../tools/forms';
import { validateTokenAccount } from '../../../../tools/validators/accounts/token';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';
import { contexts } from '@oyster/common';
import {
  getMintMinAmountAsDecimal,
  parseMintNaturalAmountFromDecimal,
} from '../../../../tools/units';
import { ProgramAccount } from '@solana/spl-governance';

const { useMint } = contexts.Accounts;

export const SplTokenMintToForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const mintInfo = useMint(governance.account.governedAccount);

  if (!mintInfo) {
    return <Spin />;
  }

  const { token: tokenProgramId } = utils.programIds();

  const onCreate = async ({
    destination,
    amount,
  }: {
    destination: string;
    amount: string;
  }) => {
    const mintAmount = parseMintNaturalAmountFromDecimal(
      amount,
      mintInfo.decimals,
    );

    const mintToIx = Token.createMintToInstruction(
      tokenProgramId,
      governance.account.governedAccount,
      new PublicKey(destination),
      governance.pubkey,
      [],
      mintAmount,
    );

    onCreateInstruction(mintToIx);
  };

  const tokenAccountValidator = (
    info: AccountInfo<Buffer | ParsedAccountData>,
  ) => validateTokenAccount(info, governance.account.governedAccount);

  const mintMinAmount = getMintMinAmountAsDecimal(mintInfo);

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ amount: 1 }}
    >
      <Form.Item label="program id">
        <ExplorerLink address={tokenProgramId} type="address" />
      </Form.Item>
      <Form.Item label="mint">
        <ExplorerLink
          address={governance.account.governedAccount}
          type="address"
        />
      </Form.Item>
      <Form.Item label="mint authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>

      <AccountFormItem
        name="destination"
        label="destination account"
        accountInfoValidator={tokenAccountValidator}
      ></AccountFormItem>

      <Form.Item name="amount" label="amount" rules={[{ required: true }]}>
        <InputNumber
          min={mintMinAmount}
          stringMode
          style={{ width: 200 }}
          step={mintMinAmount}
        />
      </Form.Item>
    </Form>
  );
};

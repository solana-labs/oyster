import { Form, FormInstance, InputNumber, Spin } from 'antd';
import { ExplorerLink, ParsedAccount, utils } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
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

const { useMint } = contexts.Accounts;

export const SplTokenMintToForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const mintInfo = useMint(governance.info.governedAccount);

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
      governance.info.governedAccount,
      new PublicKey(destination),
      governance.pubkey,
      [],
      mintAmount,
    );

    onCreateInstruction(mintToIx);
  };

  const tokenAccountValidator = (
    info: AccountInfo<Buffer | ParsedAccountData>,
  ) => validateTokenAccount(info, governance.info.governedAccount);

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
          address={governance.info.governedAccount}
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

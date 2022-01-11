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
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';

import { contexts } from '@oyster/common';
import { validateTokenAccount } from '../../../../tools/validators/accounts/token';
import {
  getMintMinAmountAsDecimal,
  parseMintNaturalAmountFromDecimal,
} from '../../../../tools/units';
import { ProgramAccount } from '@solana/spl-governance';

const { useAccount: useTokenAccount } = contexts.Accounts;
const { useMint } = contexts.Accounts;

export const SplTokenTransferForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const { token: tokenProgramId } = utils.programIds();
  const sourceTokenAccount = useTokenAccount(
    governance.account.governedAccount,
  );
  const mintInfo = useMint(sourceTokenAccount?.info.mint);

  if (!(mintInfo && sourceTokenAccount)) {
    return <Spin />;
  }

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

    const transferIx = Token.createTransferInstruction(
      tokenProgramId,
      governance.account.governedAccount,
      new PublicKey(destination),
      governance.pubkey,
      [],
      mintAmount,
    );

    onCreateInstruction(transferIx);
  };

  const tokenAccountValidator = (
    info: AccountInfo<Buffer | ParsedAccountData>,
  ) => validateTokenAccount(info, sourceTokenAccount?.info.mint);

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
      <Form.Item label="source account">
        <ExplorerLink
          address={governance.account.governedAccount}
          type="address"
        />
      </Form.Item>
      <Form.Item label="account owner (governance account)">
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

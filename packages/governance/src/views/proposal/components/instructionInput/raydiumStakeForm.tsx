import { Form, FormInstance, Spin } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';

import { contexts } from '@oyster/common';

import { depositInstruction } from '../../../../tools/raydium/raydium';

const { useAccount: useTokenAccount } = contexts.Accounts;
const { useMint } = contexts.Accounts;

export const RaydiumStakeForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const sourceTokenAccount = useTokenAccount(governance.info.governedAccount);
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
    const raydiumIx = depositInstruction(
      new PublicKey('EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q'),
      // staking pool
      new PublicKey('5DFbcYNLLy5SJiBpCCDzNSs7cWCsUbYnCkLXzcPQiKnR'),
      new PublicKey('DdFXxCbn5vpxPRaGmurmefCTTSUa5XZ9Kh6Noc4bvrU9'),
      // user
      new PublicKey('CjvTxyoZPfSg1aDchw79RmwFfkuWb5v1obhCt4dfw9mq'), // created user info account
      new PublicKey('BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ'), // governance PDA

      new PublicKey('GbrNTxmoWhYYTY2yjnJFDyM79w9KzNmuzY6BBpUmvZGZ'), // governance RAY-SRM LP token account
      new PublicKey('792c58UHPPuLJcYZ6nawcD5F5NQXGbBos9ZGczTrLSdb'),

      new PublicKey('8bVecpkd9gbK8VtYKHxjjL1uXnSevgdH8BAnuKjScacf'), // governance RAY account
      new PublicKey('5ihtMmeTAx3kdf459Yt3bqos5zDe4WBBcSZSB6ooNxLt'),

      1, // amount
    );

    onCreateInstruction(raydiumIx);
  };

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ amount: 1 }}
    >
      <Form.Item label="account owner (governance account) - stake">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};

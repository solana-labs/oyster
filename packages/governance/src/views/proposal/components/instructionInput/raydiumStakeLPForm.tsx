import { Form, FormInstance, Spin } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';

import { contexts } from '@oyster/common';

import { depositInstruction } from '../../../../tools/raydium/raydium';
import { getRAYGovernanceAta, getRaySrmLpUserAccount } from './yieldFarming';

const { useAccount: useTokenAccount } = contexts.Accounts;
const { useMint } = contexts.Accounts;
const { useConnection } = contexts.Connection;

export const RaydiumStakeLPForm = ({
  form,
  governance,
  onCreateInstruction,
  isHarvest,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
  isHarvest: boolean;
}) => {
  const sourceTokenAccount = useTokenAccount(governance.info.governedAccount);
  const mintInfo = useMint(sourceTokenAccount?.info.mint);
  const connection = useConnection();

  if (!(mintInfo && sourceTokenAccount)) {
    return <Spin />;
  }

  const onCreate = async () => {
    const governancePk = governance.pubkey;

    const rayAta = await getRAYGovernanceAta(governancePk);

    let lpAmount = 0;

    if (!isHarvest) {
      const lpTokenAmount = await connection.getTokenAccountBalance(
        governance.info.governedAccount,
      );
      lpAmount = parseInt(lpTokenAmount.value.amount);
    }

    const lpUserAccount = getRaySrmLpUserAccount(governancePk);

    // stake/harvest RAY-SRM LP
    let raydiumIx = depositInstruction(
      new PublicKey('EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q'),
      // staking pool
      new PublicKey('5DFbcYNLLy5SJiBpCCDzNSs7cWCsUbYnCkLXzcPQiKnR'),
      new PublicKey('DdFXxCbn5vpxPRaGmurmefCTTSUa5XZ9Kh6Noc4bvrU9'),
      // user
      lpUserAccount, // created user info account
      governancePk, // governance PDA

      governance.info.governedAccount, // governance RAY-SRM LP token account
      new PublicKey('792c58UHPPuLJcYZ6nawcD5F5NQXGbBos9ZGczTrLSdb'),

      rayAta, // governance RAY account
      new PublicKey('5ihtMmeTAx3kdf459Yt3bqos5zDe4WBBcSZSB6ooNxLt'),

      lpAmount, // amount
    );

    // stake/harvest RAY
    // raydiumIx = depositInstruction(
    //   new PublicKey('EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q'),
    //   // staking pool
    //   new PublicKey('4EwbZo8BZXP5313z5A2H11MRBP15M5n6YxfmkjXESKAW'),
    //   new PublicKey('4qD717qKoj3Sm8YfHMSR7tSKjWn5An817nArA6nGdcUR'),
    //   // user
    //   new PublicKey('HPDnbMNypc2BPMMzm8PKNRtPm1xgkr8YfgdUePL8oNrb'), // created user info account
    //   new PublicKey('BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ'), // governance PDA

    //   new PublicKey('8bVecpkd9gbK8VtYKHxjjL1uXnSevgdH8BAnuKjScacf'), // governance RAY  account
    //   new PublicKey('8tnpAECxAT9nHBqR1Ba494Ar5dQMPGhL31MmPJz1zZvY'),

    //   new PublicKey('8bVecpkd9gbK8VtYKHxjjL1uXnSevgdH8BAnuKjScacf'), // governance RAY account
    //   new PublicKey('BihEG2r7hYax6EherbRmuLLrySBuSXx4PYGd9gAsktKY'),

    //   0, // amount
    // );

    onCreateInstruction(raydiumIx);
  };

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ amount: 1 }}
    >
      <Form.Item
        label={`${
          isHarvest ? 'harvest RAY from RAY-SRM LP farm' : 'stake RAY-SRM LP'
        }`}
      >
        {' '}
      </Form.Item>
      <Form.Item label="account owner (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};

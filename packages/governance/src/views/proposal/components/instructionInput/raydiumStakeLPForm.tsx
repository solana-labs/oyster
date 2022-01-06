import { Form, FormInstance, Spin } from 'antd';
import { ExplorerLink } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';

import { contexts } from '@oyster/common';

import { depositInstruction } from '../../../../tools/raydium/raydium';
import {
  getRAYGovernanceAta,
  getRaySrmLpFarmUserAccount,
} from './yieldFarming';
import { ProgramAccount } from '../../../../models/tools/solanaSdk';

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
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
  isHarvest: boolean;
}) => {
  const sourceTokenAccount = useTokenAccount(governance.account.governedAccount);
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
        governance.account.governedAccount,
      );
      lpAmount = parseInt(lpTokenAmount.value.amount);
    }

    const lpUserAccount = getRaySrmLpFarmUserAccount(governancePk);

    // stake/harvest RAY-SRM LP
    const raydiumIx = depositInstruction(
      new PublicKey('EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q'),
      // staking pool
      new PublicKey('5DFbcYNLLy5SJiBpCCDzNSs7cWCsUbYnCkLXzcPQiKnR'),
      new PublicKey('DdFXxCbn5vpxPRaGmurmefCTTSUa5XZ9Kh6Noc4bvrU9'),

      // user
      lpUserAccount, // created user info account
      governancePk, // governance PDA

      governance.account.governedAccount, // governance RAY-SRM LP token account
      new PublicKey('792c58UHPPuLJcYZ6nawcD5F5NQXGbBos9ZGczTrLSdb'),

      rayAta, // governance RAY account
      new PublicKey('5ihtMmeTAx3kdf459Yt3bqos5zDe4WBBcSZSB6ooNxLt'),

      lpAmount, // amount
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
      <Form.Item
        label={`${isHarvest ? 'harvest RAY from RAY-SRM LP farm' : 'stake RAY-SRM LP'
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

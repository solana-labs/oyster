import { Form, FormInstance, Spin } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';

import { contexts } from '@oyster/common';

import { depositInstruction } from '../../../../tools/raydium/raydium';
import { getRayFarmUserAccount, getRAYGovernanceAta } from './yieldFarming';

const { useAccount: useTokenAccount } = contexts.Accounts;
const { useMint } = contexts.Accounts;
const { useConnection } = contexts.Connection;

export const RaydiumStakeRAYForm = ({
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

    let rayAmount = 0;

    if (!isHarvest) {
      const rayTokenAmount = await connection.getTokenAccountBalance(rayAta);
      rayAmount = parseInt(rayTokenAmount.value.amount);
    }

    const rayUserAccount = getRayFarmUserAccount(governancePk);

    // stake/harvest RAY
    const raydiumIx = depositInstruction(
      new PublicKey('EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q'),
      // staking pool
      new PublicKey('4EwbZo8BZXP5313z5A2H11MRBP15M5n6YxfmkjXESKAW'),
      new PublicKey('4qD717qKoj3Sm8YfHMSR7tSKjWn5An817nArA6nGdcUR'),
      // user
      rayUserAccount, // created user info account
      governancePk, // governance PDA

      rayAta, // governance RAY  account
      new PublicKey('8tnpAECxAT9nHBqR1Ba494Ar5dQMPGhL31MmPJz1zZvY'),

      rayAta, // governance RAY account
      new PublicKey('BihEG2r7hYax6EherbRmuLLrySBuSXx4PYGd9gAsktKY'),

      rayAmount, // amount
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
      <Form.Item label={`${isHarvest ? 'harvest RAY' : 'stake RAY'}`}>
        {' '}
      </Form.Item>
      <Form.Item label="account owner (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};

import { ProgramAccount, Realm } from '@solana/spl-governance';
import { PublicKey } from '@solana/web3.js';
import { Form, InputNumber } from 'antd';
import BN from 'bn.js';

import React from 'react';

import { getNameOf } from '../../tools/script';
import { getSecondsFromYears } from '../../tools/units';
import { getScaledFactor } from '../../tools/voterStakeRegistry/voterStakeRegistry';
import { MintFormItem } from '../MintFormItem/mintFormItem';

export interface VotingMintConfigValues {
  mint: string;
  digitShift: number;
  unlockedFactor: number;
  maxVotingTime: number;
  lockupFactor: number;
  lockupSaturationYears: number;
}

export function getVotingMintConfigApiValues(values: VotingMintConfigValues) {
  const digitShift = values.digitShift;
  const unlockedScaledFactor = getScaledFactor(values.unlockedFactor);
  const lockupScaledFactor = getScaledFactor(values.lockupFactor);
  const lockupSaturationSecs = new BN(
    getSecondsFromYears(values.lockupSaturationYears).toString(),
  );
  const mint = new PublicKey(values.mint);

  return {
    digitShift,
    unlockedScaledFactor,
    lockupScaledFactor,
    lockupSaturationSecs,
    mint,
  };
}

const configNameOf = getNameOf<VotingMintConfigValues>();

export function VotingMintConfigFormItem({
  realm,
}: {
  realm: ProgramAccount<Realm>;
}) {
  return (
    <>
      <MintFormItem
        name={configNameOf('mint')}
        label="mint"
        initialValue={realm.account.communityMint}
      ></MintFormItem>

      <Form.Item
        name={configNameOf('digitShift')}
        label={'mint digit shift'}
        rules={[{ required: true }]}
        initialValue={0}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name={configNameOf('unlockedFactor')}
        label={'mint unlocked factor'}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name={configNameOf('lockupFactor')}
        label={'mint lockup factor'}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name={configNameOf('lockupSaturationYears')}
        label={'mint lockup saturation (years)'}
        rules={[{ required: true }]}
        initialValue={5}
      >
        <InputNumber min={1} />
      </Form.Item>
    </>
  );
}

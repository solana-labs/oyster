import { ExplorerLink } from '@oyster/common';
import { ProgramAccount, Realm } from '@solana/spl-governance';
import { Form, InputNumber } from 'antd';
import BN from 'bn.js';

import React from 'react';

import { getNameOf } from '../../tools/script';
import { getSecondsFromYears } from '../../tools/units';
import { getScaledFactor } from '../../tools/voterStakeRegistry/voterStakeRegistry';

export interface VotingMintConfigValues {
  digitShift: number;
  depositFactor: number;
  maxVotingTime: number;
  lockupFactor: number;
  lockupSaturationYears: number;
}

export function getVotingMintConfigApiValues(values: VotingMintConfigValues) {
  const digitShift = values.digitShift;
  const depositScaledFactor = getScaledFactor(values.depositFactor);
  const lockupScaledFactor = getScaledFactor(values.lockupFactor);
  const lockupSaturationSecs = new BN(
    getSecondsFromYears(values.lockupSaturationYears).toString(),
  );

  return {
    digitShift,
    depositScaledFactor,
    lockupScaledFactor,
    lockupSaturationSecs,
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
      <Form.Item label="community mint">
        <ExplorerLink address={realm.account.communityMint} type="address" />
      </Form.Item>

      <Form.Item
        name={configNameOf('digitShift')}
        label={'mint digit shift'}
        rules={[{ required: true }]}
        initialValue={0}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name={configNameOf('depositFactor')}
        label={'mint deposit factor'}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <InputNumber min={1} />
      </Form.Item>

      <Form.Item
        name={configNameOf('lockupFactor')}
        label={'mint lockup factor'}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <InputNumber min={1} />
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

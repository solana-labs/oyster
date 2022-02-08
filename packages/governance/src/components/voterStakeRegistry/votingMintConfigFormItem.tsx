import { Governance, ProgramAccount, Realm } from '@solana/spl-governance';
import { PublicKey } from '@solana/web3.js';
import { Form, InputNumber, Select } from 'antd';
import BN from 'bn.js';

import React from 'react';
import { useGovernancesByRealm } from '../../hooks/apiHooks';

import { getNameOf } from '../../tools/script';
import { getSecondsFromYears } from '../../tools/units';
import { getScaledFactor } from '../../tools/voterStakeRegistry/voterStakeRegistry';
import { MintFormItem } from '../MintFormItem/mintFormItem';


export interface VotingMintConfigValues {
  mint: string;
  mintIndex: number;
  digitShift: number;
  unlockedFactor: number;
  maxVotingTime: number;
  lockupFactor: number;
  lockupSaturationYears: number;
  grantAuthority: string;
}

export function getVotingMintConfigApiValues(values: VotingMintConfigValues) {
  const digitShift = values.digitShift;
  const unlockedScaledFactor = getScaledFactor(values.unlockedFactor);
  const lockupScaledFactor = getScaledFactor(values.lockupFactor);
  const lockupSaturationSecs = new BN(
    getSecondsFromYears(values.lockupSaturationYears).toString(),
  );
  const mint = new PublicKey(values.mint);
  const mintIndex = values.mintIndex;
  const grantAuthority = new PublicKey(values.grantAuthority);

  return {
    digitShift,
    unlockedScaledFactor,
    lockupScaledFactor,
    lockupSaturationSecs,
    mint,
    grantAuthority,
    mintIndex
  };
}

const configNameOf = getNameOf<VotingMintConfigValues>();

export function VotingMintConfigFormItem({
  realm,
  governance,
}: {
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
}) {

  const governances = useGovernancesByRealm(realm?.pubkey);

  return (
    <>
      <MintFormItem
        name={configNameOf('mint')}
        label="mint"
        initialValue={realm.account.communityMint}
      ></MintFormItem>

      <Form.Item
        name={configNameOf('mintIndex')}
        label={'mint index'}
        rules={[{ required: true }]}
        initialValue={0}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name={configNameOf('grantAuthority')}
        label="grant authority (governance)"
        rules={[{ required: true }]}
        initialValue={governance.pubkey.toBase58()}
      >
        <Select>
          {governances.map(g => (
            <Select.Option
              value={g.pubkey.toBase58()}
              key={g.pubkey.toBase58()}
            >
              {g.account.governedAccount.toBase58()}
            </Select.Option>
          ))}
        </Select>
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

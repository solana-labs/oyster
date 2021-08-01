import { Form, InputNumber, Space, Typography } from 'antd';
import React, { useState } from 'react';
import {
  MintMaxVoteWeightSource,
  MintMaxVoteWeightSourceType,
} from '../../models/accounts';
import { BigNumber } from 'bignumber.js';
import { MintInfo } from '@solana/spl-token';
import { contexts } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getNameOf } from '../../tools/script';

const { Text } = Typography;
const { useMint } = contexts.Accounts;

const getMinSupplyFractionStep = () =>
  new BigNumber(1)
    .shiftedBy(-1 * MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS)
    .toNumber();

const getMintSupplyFraction = (
  maxVoteWeightSource: MintMaxVoteWeightSource,
) => {
  if (maxVoteWeightSource.type !== MintMaxVoteWeightSourceType.SupplyFraction) {
    throw new Error(
      `Max vote weight source ${maxVoteWeightSource.type} is not supported`,
    );
  }

  return new BigNumber(maxVoteWeightSource.value.toString())
    .shiftedBy(-MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS)
    .toNumber();
};

export const formatMintSupplyFraction = (
  mint: MintInfo,
  decimalFraction: number,
) => {
  return new BigNumber(decimalFraction)
    .multipliedBy(mint.supply.toString())
    .shiftedBy(-mint.decimals)
    .toFormat(mint.decimals);
};

const formatMintSupplyPercentage = (decimalFraction: number) => {
  const percentage = new BigNumber(decimalFraction).shiftedBy(2).toNumber();

  if (percentage < 0.01) {
    return '<0.01%';
  }

  const rounded = +percentage.toFixed(2);
  return rounded === percentage ? `${rounded}%` : `~${rounded}%`;
};

export const parseMintSupplyFraction = (fraction: string) => {
  if (!fraction) {
    return MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION;
  }

  const fractionValue = new BigNumber(fraction)
    .shiftedBy(MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS)
    .toNumber();

  return new MintMaxVoteWeightSource({
    value: new BN(fractionValue),
  });
};

export interface RealmMintSupplyConfigValues {
  communityMintMaxVoteWeightFraction: string;
}

const configNameOf = getNameOf<RealmMintSupplyConfigValues>();

export function RealmMintSupplyConfigFormItem({
  communityMintAddress,
  maxVoteWeightSource,
}: {
  communityMintAddress: PublicKey | string | undefined;
  maxVoteWeightSource: MintMaxVoteWeightSource;
}) {
  const [supplyFraction, setSupplyFraction] = useState<number | undefined>(
    getMintSupplyFraction(maxVoteWeightSource),
  );
  const communityMint = useMint(communityMintAddress);

  const onSupplyFractionChange = (fraction: number | string) => {
    let floatFraction;

    if (typeof fraction === 'string') {
      floatFraction = parseFloat(fraction);
    } else {
      floatFraction = fraction;
    }

    setSupplyFraction(floatFraction || undefined);
  };

  return (
    <Form.Item label="community mint supply factor (max vote weight)">
      <Space align="end">
        <Form.Item
          rules={[{ required: true }]}
          noStyle
          name={configNameOf('communityMintMaxVoteWeightFraction')}
          initialValue={supplyFraction}
          label="mint supply factor"
        >
          <InputNumber
            min={getMinSupplyFractionStep()}
            max={1}
            step={getMinSupplyFractionStep()}
            onChange={onSupplyFractionChange}
            style={{ width: 150 }}
            stringMode={true}
          />
        </Form.Item>

        {supplyFraction && (
          <Text type="secondary">
            {`${
              communityMint
                ? formatMintSupplyFraction(communityMint, supplyFraction)
                : ''
            } (${formatMintSupplyPercentage(supplyFraction)})`}
          </Text>
        )}
      </Space>
    </Form.Item>
  );
}

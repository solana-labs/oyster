import { PublicKey } from '@solana/web3.js';
import { Form, InputNumber, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { contexts } from '@oyster/common';
import {
  formatPercentage,
  getMintMinAmountAsDecimal,
  getMintSupplyAsDecimal,
  getMintSupplyFractionAsDecimalPercentage,
  getMintSupplyPercentageAsDecimal,
} from '../../tools/units';
import { parseMinTokensToCreateProposal } from '../governanceConfigFormItem/governanceConfigFormItem';

const { useMint } = contexts.Accounts;
const { Text } = Typography;

export function RealmMintTokensFormItem({
  communityMintAddress,
}: {
  communityMintAddress: PublicKey | string | undefined;
}) {
  // TODO: Most of the component code was copied from MinTokensToCreateProposal
  // Unify this code with that component and create a shared MinTokensToCreate

  const communityMintInfo = useMint(communityMintAddress);
  const [minTokensPercentage, setMinTokensPercentage] = useState<
    number | undefined
  >();

  if (!communityMintInfo || !communityMintAddress) {
    if (minTokensPercentage) {
      setMinTokensPercentage(undefined);
    }

    return (
      <Form.Item label="min community tokens to create governance">
        <InputNumber style={{ width: 200 }} disabled={true} />
      </Form.Item>
    );
  }

  let mintDecimals = communityMintInfo.decimals;

  // Use 1% of mint supply as the default value for minTokensToCreateProposal and the default increment step in the input editor
  let mintSupply1Percent = getMintSupplyPercentageAsDecimal(
    communityMintInfo,
    1,
  );

  let minTokenAmount = getMintMinAmountAsDecimal(communityMintInfo);
  let maxTokenAmount = getMintSupplyAsDecimal(communityMintInfo);

  // If the supply is small and 1% is below the minimum mint amount then coerce to the minimum value
  let minTokenStep = Math.max(mintSupply1Percent, minTokenAmount);

  let minTokensToCreateProposal = minTokenStep;

  const getMinTokensPercentage = (amount: number) =>
    getMintSupplyFractionAsDecimalPercentage(communityMintInfo, amount);

  const onMinTokensChange = (minTokensToCreateProposal: number | string) => {
    const minTokens = parseMinTokensToCreateProposal(
      minTokensToCreateProposal,
      mintDecimals,
    );
    setMinTokensPercentage(getMinTokensPercentage(minTokens));
  };

  if (!minTokensPercentage) {
    onMinTokensChange(minTokensToCreateProposal);
  }

  return (
    <>
      <Form.Item label="min community tokens to create governance">
        <Space align="end">
          <Form.Item
            name="minTokensToCreateGovernance"
            rules={[{ required: true }]}
            initialValue={minTokensToCreateProposal}
            noStyle
          >
            <InputNumber
              min={minTokenAmount}
              max={maxTokenAmount}
              step={minTokenStep}
              onChange={onMinTokensChange}
              style={{ width: 200 }}
              stringMode={mintDecimals !== 0}
            />
          </Form.Item>
          {minTokensPercentage && (
            <Text type="secondary">{`${formatPercentage(
              minTokensPercentage,
            )} of token supply`}</Text>
          )}
        </Space>
      </Form.Item>

      <Form.Item
        hidden
        name="mintDecimals"
        initialValue={mintDecimals}
      ></Form.Item>
    </>
  );
}

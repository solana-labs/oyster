import { Form, InputNumber, Space, Spin, Typography } from 'antd';
import BN from 'bn.js';
import React, { useState } from 'react';
import { contexts, ParsedAccount, constants } from '@oyster/common';
import { LABELS } from '../../constants';
import {
  GovernanceConfig,
  Realm,
  VoteThresholdPercentage,
  VoteWeightSource,
} from '../../models/accounts';
import { getNameOf } from '../../tools/script';
import {
  getDaysFromTimestamp,
  getMintNaturalAmountFromDecimal,
  getMintDecimalAmountFromNatural,
  getMintSupplyPercentageAsDecimal,
  getMintMinAmountAsDecimal,
  getTimestampFromDays,
  parseMintNaturalAmountFromDecimal,
  getMintSupplyFractionAsDecimalPercentage,
  getMintSupplyAsDecimal,
  formatPercentage,
} from '../../tools/units';

const { ZERO } = constants;

const { Text } = Typography;
const { useMint } = contexts.Accounts;

export interface GovernanceConfigValues {
  minTokensToCreateProposal: number | string;
  minInstructionHoldUpTime: number;
  maxVotingTime: number;
  voteThresholdPercentage: number;
  mintDecimals: number;
}

export function getGovernanceConfig(values: GovernanceConfigValues) {
  const minTokensToCreateProposal = parseMinTokensToCreateProposal(
    values.minTokensToCreateProposal,
    values.mintDecimals,
  );

  return new GovernanceConfig({
    voteThresholdPercentage: new VoteThresholdPercentage({
      value: values.voteThresholdPercentage,
    }),
    minCommunityTokensToCreateProposal: new BN(minTokensToCreateProposal),
    minInstructionHoldUpTime: getTimestampFromDays(
      values.minInstructionHoldUpTime,
    ),
    maxVotingTime: getTimestampFromDays(values.maxVotingTime),
    // Use 1 as default for council tokens.
    // Council tokens are rare and possession of any amount of council tokens should be sufficient to be allowed to create proposals
    // If it turns to be a wrong assumption then it should be exposed in the UI
    minCouncilTokensToCreateProposal: new BN(1),
  });
}

function parseMinTokensToCreateProposal(
  value: string | number,
  mintDecimals: number,
) {
  return typeof value === 'string'
    ? parseMintNaturalAmountFromDecimal(value, mintDecimals)
    : getMintNaturalAmountFromDecimal(value, mintDecimals);
}

const configNameOf = getNameOf<GovernanceConfigValues>();

export function GovernanceConfigFormItem({
  governanceConfig,
  realm,
}: {
  governanceConfig?: GovernanceConfig;
  realm: ParsedAccount<Realm> | undefined;
}) {
  const communityMintInfo = useMint(realm?.info.communityMint);
  const [minTokensPercentage, setMinTokensPercentage] = useState<
    number | undefined
  >();

  if (!communityMintInfo) {
    return <Spin></Spin>;
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

  if (!governanceConfig) {
    governanceConfig = new GovernanceConfig({
      voteThresholdPercentage: new VoteThresholdPercentage({ value: 60 }),
      minCommunityTokensToCreateProposal: ZERO,
      minInstructionHoldUpTime: getTimestampFromDays(1),
      maxVotingTime: getTimestampFromDays(3),
      voteWeightSource: VoteWeightSource.Deposit,
      proposalCoolOffTime: 0,
      minCouncilTokensToCreateProposal: ZERO,
    });
  } else {
    minTokensToCreateProposal = getMintDecimalAmountFromNatural(
      communityMintInfo,
      governanceConfig.minCommunityTokensToCreateProposal,
    ).toNumber();
  }

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
      <Form.Item label={LABELS.MIN_TOKENS_TO_CREATE_PROPOSAL}>
        <Space align="end">
          <Form.Item
            name={configNameOf('minTokensToCreateProposal')}
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
        name={configNameOf('minInstructionHoldUpTime')}
        label={LABELS.MIN_INSTRUCTION_HOLD_UP_TIME_DAYS}
        rules={[{ required: true }]}
        initialValue={getDaysFromTimestamp(
          governanceConfig.minInstructionHoldUpTime,
        )}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name={configNameOf('maxVotingTime')}
        label={LABELS.MAX_VOTING_TIME_DAYS}
        rules={[{ required: true }]}
        initialValue={getDaysFromTimestamp(governanceConfig.maxVotingTime)}
      >
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item
        name={configNameOf('voteThresholdPercentage')}
        label={LABELS.YES_VOTE_THRESHOLD_PERCENTAGE}
        rules={[{ required: true }]}
        initialValue={governanceConfig.voteThresholdPercentage.value}
      >
        <InputNumber maxLength={3} min={1} max={100} />
      </Form.Item>

      <Form.Item
        hidden
        name={configNameOf('mintDecimals')}
        initialValue={mintDecimals}
      ></Form.Item>
    </>
  );
}

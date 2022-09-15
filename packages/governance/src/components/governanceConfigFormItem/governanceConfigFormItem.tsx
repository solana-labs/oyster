import { Form, Input, InputNumber, Select, Space, Spin, Typography } from 'antd';
import BN from 'bn.js';
import React, { useState } from 'react';
import { constants, contexts } from '@oyster/common';
import { LABELS } from '../../constants';
import { GovernanceConfig, ProgramAccount, Realm, VoteThresholdPercentage, VoteTipping } from '@solana/spl-governance';
import { getNameOf } from '../../tools/script';
import {
  formatPercentage,
  getDaysFromTimestamp,
  getMintDecimalAmountFromNatural,
  getMintMinAmountAsDecimal,
  getMintNaturalAmountFromDecimal,
  getMintSupplyAsDecimal,
  getMintSupplyFractionAsDecimalPercentage,
  getMintSupplyPercentageAsDecimal,
  getTimestampFromDays,
  parseMintNaturalAmountFromDecimal
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
  voteTipping: VoteTipping;
}

export function getGovernanceConfig(values: GovernanceConfigValues) {
  const minTokensToCreateProposal = parseMinTokensToCreate(
    values.minTokensToCreateProposal,
    values.mintDecimals
  );

  return new GovernanceConfig({
    voteThresholdPercentage: new VoteThresholdPercentage({
      value: values.voteThresholdPercentage
    }),
    minCommunityTokensToCreateProposal: new BN(
      minTokensToCreateProposal.toString()
    ),
    minInstructionHoldUpTime: getTimestampFromDays(
      values.minInstructionHoldUpTime
    ),
    maxVotingTime: getTimestampFromDays(values.maxVotingTime),
    // Use 1 as default for council tokens.
    // Council tokens are rare and possession of any amount of council tokens should be sufficient to be allowed to create proposals
    // If it turns to be a wrong assumption then it should be exposed in the UI
    minCouncilTokensToCreateProposal: new BN(1),
    voteTipping: values.voteTipping
  });
}

// Parses min tokens to create (proposal or governance)
export function parseMinTokensToCreate(
  value: string | number,
  mintDecimals: number
) {
  return typeof value === 'string'
    ? parseMintNaturalAmountFromDecimal(value, mintDecimals)
    : getMintNaturalAmountFromDecimal(value, mintDecimals);
}

const configNameOf = getNameOf<GovernanceConfigValues>();

export interface GovernanceConfigFormItemProps {
  governanceConfig?: GovernanceConfig;
  realm: ProgramAccount<Realm> | undefined;
}

export function GovernanceConfigFormItem({ governanceConfig, realm }: GovernanceConfigFormItemProps) {
  const communityMintInfo = useMint(realm?.account.communityMint);
  const [minTokensPercentage, setMinTokensPercentage] = useState<number | undefined>();

  if (!communityMintInfo) {
    return <Spin></Spin>;
  }

  let mintDecimals = communityMintInfo.decimals;

  // Use 1% of mint supply as the default value for minTokensToCreateProposal and the default increment step in the input editor
  let mintSupply1Percent = getMintSupplyPercentageAsDecimal(
    communityMintInfo,
    1
  );

  let minTokenAmount = getMintMinAmountAsDecimal(communityMintInfo);
  let maxTokenAmount = !communityMintInfo.supply.isZero()
    ? getMintSupplyAsDecimal(communityMintInfo)
    : undefined;

  // If the supply is small and 1% is below the minimum mint amount then coerce to the minimum value
  let minTokenStep = Math.max(mintSupply1Percent, minTokenAmount);

  let minTokensToCreateProposal = communityMintInfo.supply.isZero()
    ? 1000000 // If the mint supply is zero then we use 1m as arbitrary large number
    : minTokenStep;

  if (!governanceConfig) {
    governanceConfig = new GovernanceConfig({
      voteThresholdPercentage: new VoteThresholdPercentage({ value: 60 }),
      minCommunityTokensToCreateProposal: ZERO,
      minInstructionHoldUpTime: getTimestampFromDays(0),
      maxVotingTime: getTimestampFromDays(3),
      voteTipping: VoteTipping.Strict,
      proposalCoolOffTime: 0,
      minCouncilTokensToCreateProposal: ZERO
    });
  } else {
    minTokensToCreateProposal = getMintDecimalAmountFromNatural(
      communityMintInfo,
      governanceConfig.minCommunityTokensToCreateProposal as BN
    ).toNumber();
  }

  const getMinTokensPercentage = (amount: number) =>
    getMintSupplyFractionAsDecimalPercentage(communityMintInfo, amount);

  const onMinTokensChange = (minTokensToCreateProposal: number | string) => {
    const minTokens = parseMinTokensToCreate(
      minTokensToCreateProposal,
      mintDecimals
    );
    setMinTokensPercentage(getMinTokensPercentage(minTokens));
  };

  if (!minTokensPercentage) {
    onMinTokensChange(minTokensToCreateProposal);
  }

  return (
    <>
      <Form.Item label={LABELS.MIN_TOKENS_TO_CREATE_PROPOSAL}>
        <Space align='end'>
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
          {maxTokenAmount && minTokensPercentage && (
            <Text type='secondary'>{`${formatPercentage(
              minTokensPercentage
            )} of token supply`}</Text>
          )}
        </Space>
      </Form.Item>

      <Form.Item
        name={configNameOf('minInstructionHoldUpTime')}
        label={LABELS.MIN_INSTRUCTION_HOLD_UP_TIME_DAYS}
        rules={[{ required: true }]}
        initialValue={getDaysFromTimestamp(
          governanceConfig.minInstructionHoldUpTime
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
        <InputNumber min={0.01} />
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
        name={configNameOf('voteTipping')}
        label={LABELS.VOTE_TIPPING}
        rules={[{ required: true }]}
        initialValue={VoteTipping[governanceConfig.voteTipping]}
      >
        <Select>{Object.keys(VoteTipping)
          .filter(vt => typeof VoteTipping[vt as any] === 'string')
          .map((vt, key) => (<Select.Option value={vt} key={key}>{VoteTipping[vt as any]}</Select.Option>))}
        </Select>
      </Form.Item>

      <Form.Item
        hidden
        name={configNameOf('mintDecimals')}
        initialValue={mintDecimals}><Input/></Form.Item>
    </>
  );
}

import { Form, InputNumber } from 'antd';
import BN from 'bn.js';
import React from 'react';
import { LABELS } from '../../constants';
import {
  GovernanceConfig,
  VoteThresholdPercentage,
} from '../../models/accounts';
import { getNameOf } from '../../tools/script';
import { getDaysFromTimestamp, getTimestampFromDays } from '../../tools/units';

export interface GovernanceConfigValues {
  minTokensToCreateProposal: number;
  minInstructionHoldUpTime: number;
  maxVotingTime: number;
  voteThresholdPercentage: number;
}

export function getGovernanceConfig(values: GovernanceConfigValues) {
  return new GovernanceConfig({
    voteThresholdPercentage: new VoteThresholdPercentage({
      value: values.voteThresholdPercentage,
    }),
    minTokensToCreateProposal: new BN(values.minTokensToCreateProposal),
    minInstructionHoldUpTime: getTimestampFromDays(
      values.minInstructionHoldUpTime,
    ),
    maxVotingTime: getTimestampFromDays(values.maxVotingTime),
  });
}

const configNameOf = getNameOf<GovernanceConfigValues>();

export function GovernanceConfigFormItem({
  governanceConfig = GovernanceConfig.getDefault(),
}: {
  governanceConfig?: GovernanceConfig;
}) {
  return (
    <>
      <Form.Item
        name={configNameOf('minTokensToCreateProposal')}
        label={LABELS.MIN_TOKENS_TO_CREATE_PROPOSAL}
        rules={[{ required: true }]}
        initialValue={governanceConfig.minTokensToCreateProposal.toNumber()}
      >
        <InputNumber min={1} />
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
    </>
  );
}

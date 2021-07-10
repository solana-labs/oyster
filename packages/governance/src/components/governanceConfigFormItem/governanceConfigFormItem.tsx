import { Form, InputNumber } from 'antd';
import React from 'react';
import { LABELS } from '../../constants';
import { GovernanceConfig } from '../../models/accounts';
import { getNameOf } from '../../tools/script';

const configNameOf = getNameOf<GovernanceConfig>();

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
        initialValue={governanceConfig.minInstructionHoldUpTime}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name={configNameOf('maxVotingTime')}
        label={LABELS.MAX_VOTING_TIME_DAYS}
        rules={[{ required: true }]}
        initialValue={governanceConfig.maxVotingTime}
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

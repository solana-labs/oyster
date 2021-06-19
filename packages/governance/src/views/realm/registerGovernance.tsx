import React, { useState } from 'react';
import { ButtonProps, InputNumber, Radio, Checkbox } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../constants';
import { contexts } from '@oyster/common';
import { Redirect } from 'react-router';

import { GovernanceType } from '../../models/enums';
import { registerGovernance } from '../../actions/registerGovernance';
import { GovernanceConfig } from '../../models/accounts';
import BN from 'bn.js';

import { useKeyParam } from '../../hooks/useKeyParam';
import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';
import { formSlotInputStyle } from '../../tools/forms';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function RegisterGovernance({
  buttonProps,
}: {
  buttonProps: ButtonProps;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const connection = useConnection();
  const { wallet } = useWallet();
  const realmKey = useKeyParam();
  const [governanceType, setGovernanceType] = useState(GovernanceType.Account);

  const onSubmit = async (values: {
    governanceType: GovernanceType;
    minTokensToCreateProposal: number;
    minInstructionHoldUpTime: number;
    maxVotingTime: number;
    yesVoteThresholdPercentage: number;
    governedAccountAddress: string;
    transferUpgradeAuthority: boolean;
  }) => {
    const config = new GovernanceConfig({
      realm: realmKey,
      governedAccount: new PublicKey(values.governedAccountAddress),
      yesVoteThresholdPercentage: values.yesVoteThresholdPercentage,
      minTokensToCreateProposal: values.minTokensToCreateProposal,
      minInstructionHoldUpTime: new BN(values.minInstructionHoldUpTime),
      maxVotingTime: new BN(values.maxVotingTime),
    });
    return await registerGovernance(
      connection,
      wallet,
      values.governanceType,
      realmKey,
      config,
      values.transferUpgradeAuthority,
    );
  };

  const onComplete = (pk: PublicKey) => {
    setRedirectTo(pk.toBase58());
  };

  if (redirectTo) {
    return <Redirect push to={'/governance/' + redirectTo} />;
  }

  return (
    <ModalFormAction<PublicKey>
      label={LABELS.REGISTER_GOVERNANCE}
      buttonProps={buttonProps}
      formTitle={LABELS.REGISTER_GOVERNANCE}
      formAction={LABELS.REGISTER}
      formPendingAction={LABELS.REGISTERING}
      onSubmit={onSubmit}
      onComplete={onComplete}
      initialValues={{
        governanceType: GovernanceType.Account,
        transferUpgradeAuthority: true,
      }}
    >
      <Form.Item label={LABELS.GOVERNANCE_OVER} name="governanceType">
        <Radio.Group onChange={e => setGovernanceType(e.target.value)}>
          <Radio.Button value={GovernanceType.Account}>
            {LABELS.ACCOUNT}
          </Radio.Button>
          <Radio.Button value={GovernanceType.Program}>
            {LABELS.PROGRAM}
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="governedAccountAddress"
        label={
          governanceType === GovernanceType.Account
            ? LABELS.ACCOUNT_ADDRESS
            : LABELS.PROGRAM_ID_LABEL
        }
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      {governanceType === GovernanceType.Program && (
        <Form.Item
          name="transferUpgradeAuthority"
          label={LABELS.TRANSFER_UPGRADE_AUTHORITY}
          valuePropName="checked"
        >
          <Checkbox></Checkbox>
        </Form.Item>
      )}

      <Form.Item
        name="minTokensToCreateProposal"
        label={LABELS.MIN_TOKENS_TO_CREATE_PROPOSAL}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <InputNumber min={1} />
      </Form.Item>

      <Form.Item
        name="minInstructionHoldUpTime"
        label={LABELS.MIN_INSTRUCTION_HOLD_UP_TIME}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <InputNumber min={1} style={formSlotInputStyle} />
      </Form.Item>

      <Form.Item
        name="maxVotingTime"
        label={LABELS.MAX_VOTING_TIME}
        rules={[{ required: true }]}
        initialValue={1000000}
      >
        <InputNumber min={1} style={formSlotInputStyle} />
      </Form.Item>
      <Form.Item
        name="yesVoteThresholdPercentage"
        label={LABELS.YES_VOTE_THRESHOLD_PERCENTAGE}
        rules={[{ required: true }]}
        initialValue={60}
      >
        <InputNumber maxLength={3} min={1} max={100} />
      </Form.Item>
    </ModalFormAction>
  );
}

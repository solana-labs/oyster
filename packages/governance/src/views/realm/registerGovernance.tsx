import React, { useState } from 'react';
import { ButtonProps, InputNumber, Radio, Checkbox } from 'antd';
import { Form } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../constants';
import { contexts } from '@oyster/common';
import { Redirect } from 'react-router';

import { GovernanceType } from '../../models/enums';
import { registerGovernance } from '../../actions/registerGovernance';
import { GovernanceConfig } from '../../models/accounts';

import { useKeyParam } from '../../hooks/useKeyParam';
import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';

import { AccountFormItem } from '../../components/AccountFormItem/accountFormItem';
import BN from 'bn.js';

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
    transferAuthority: boolean;
  }) => {
    const config = new GovernanceConfig({
      realm: realmKey,
      governedAccount: new PublicKey(values.governedAccountAddress),
      voteThresholdPercentage: values.yesVoteThresholdPercentage,
      minTokensToCreateProposal: new BN(values.minTokensToCreateProposal),
      minInstructionHoldUpTime: values.minInstructionHoldUpTime * 86400,
      maxVotingTime: values.maxVotingTime * 86400,
    });
    return await registerGovernance(
      connection,
      wallet,
      values.governanceType,
      realmKey,
      config,
      values.transferAuthority,
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
        transferAuthority: true,
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
          <Radio.Button value={GovernanceType.Mint}>{LABELS.MINT}</Radio.Button>
          <Radio.Button value={GovernanceType.Token}>
            {LABELS.TOKEN_ACCOUNT}
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <AccountFormItem
        name="governedAccountAddress"
        label={
          governanceType === GovernanceType.Program
            ? LABELS.PROGRAM_ID_LABEL
            : governanceType === GovernanceType.Mint
            ? LABELS.MINT_ADDRESS_LABEL
            : governanceType === GovernanceType.Token
            ? LABELS.TOKEN_ACCOUNT_ADDRESS
            : LABELS.ACCOUNT_ADDRESS
        }
      ></AccountFormItem>

      {(governanceType === GovernanceType.Program ||
        governanceType === GovernanceType.Mint ||
        governanceType === GovernanceType.Token) && (
        <Form.Item
          name="transferAuthority"
          label={`transfer ${
            governanceType === GovernanceType.Program
              ? LABELS.UPGRADE_AUTHORITY
              : governanceType === GovernanceType.Mint
              ? LABELS.MINT_AUTHORITY
              : LABELS.TOKEN_OWNER
          } to governance`}
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
        label={LABELS.MIN_INSTRUCTION_HOLD_UP_TIME_DAYS}
        rules={[{ required: true }]}
        initialValue={1}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name="maxVotingTime"
        label={LABELS.MAX_VOTING_TIME_DAYS}
        rules={[{ required: true }]}
        initialValue={3}
      >
        <InputNumber min={1} />
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

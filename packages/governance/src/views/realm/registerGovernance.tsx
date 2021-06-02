import React, { useState } from 'react';
import { Button, ButtonProps, InputNumber, Modal, Radio } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../constants';
import { contexts, utils, tryParseKey } from '@oyster/common';
import { Redirect } from 'react-router';

import { GovernanceType } from '../../models/enums';
import { registerGovernance } from '../../actions/registerGovernance';
import { GovernanceConfig } from '../../models/accounts';
import BN from 'bn.js';

import { useKeyParam } from '../../hooks/useKeyParam';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { notify } = utils;

export function RegisterGovernance(props: ButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [redirect, setRedirect] = useState('');

  const handleOk = (a: PublicKey) => {
    setIsModalVisible(false);
    setRedirect(a.toBase58());
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (redirect) {
    setTimeout(() => setRedirect(''), 100);
    return <Redirect push to={'/governance/' + redirect} />;
  }

  return (
    <>
      <Button onClick={() => setIsModalVisible(true)} {...props}>
        {LABELS.REGISTER_GOVERNANCE}
      </Button>
      <NewGovernanceForm
        handleOk={handleOk}
        handleCancel={handleCancel}
        isModalVisible={isModalVisible}
      />
    </>
  );
}

export function NewGovernanceForm({
  handleOk,
  handleCancel,
  isModalVisible,
}: {
  handleOk: (a: PublicKey) => void;
  handleCancel: () => void;
  isModalVisible: boolean;
}) {
  const [form] = Form.useForm();
  const realmKey = useKeyParam();

  const [governanceType, setGovernanceType] = useState(GovernanceType.Account);

  const wallet = useWallet();
  const connection = useConnection();
  const onFinish = async (values: {
    governanceType: GovernanceType;
    minTokensToCreateProposal: number;
    minInstructionHoldUpTime: number;
    maxVotingTime: number;
    yesVoteThresholdPercentage: number;
    governedAccountAddress: string;
  }) => {
    if (!tryParseKey(values.governedAccountAddress)) {
      notify({
        message: LABELS.ACCOUNT_ADDRESS_IS_NOT_A_VALID_PUBLIC_KEY(
          values.governedAccountAddress,
        ),
        type: 'error',
      });
      return;
    }

    const config = new GovernanceConfig({
      realm: realmKey,
      governedAccount: new PublicKey(values.governedAccountAddress),
      yesVoteThresholdPercentage: values.yesVoteThresholdPercentage,
      minTokensToCreateProposal: values.minTokensToCreateProposal,
      minInstructionHoldUpTime: new BN(values.minInstructionHoldUpTime),
      maxVotingTime: new BN(values.maxVotingTime),
    });

    const governanceAddress = await registerGovernance(
      connection,
      wallet.wallet,
      values.governanceType ?? GovernanceType.Account,
      realmKey,
      config,
    );

    handleOk(governanceAddress);
  };

  const formLayout = {
    labelCol: { span: 24 },
    wrapperCol: { span: 24 },
  };

  const slotInputStyle = {
    width: 250,
  };

  return (
    <Modal
      title={LABELS.REGISTER_GOVERNANCE}
      visible={isModalVisible}
      onOk={form.submit}
      onCancel={handleCancel}
    >
      <Form
        {...formLayout}
        form={form}
        name="control-hooks"
        onFinish={onFinish}
      >
        <Form.Item label={LABELS.GOVERNANCE_OVER} name="governanceType">
          <Radio.Group
            defaultValue={GovernanceType.Account}
            onChange={e => setGovernanceType(e.target.value)}
          >
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
          <InputNumber min={1} style={slotInputStyle} />
        </Form.Item>

        <Form.Item
          name="maxVotingTime"
          label={LABELS.MAX_VOTING_TIME}
          rules={[{ required: true }]}
          initialValue={1000000}
        >
          <InputNumber min={1} style={slotInputStyle} />
        </Form.Item>
        <Form.Item
          name="yesVoteThresholdPercentage"
          label={LABELS.YES_VOTE_THRESHOLD_PERCENTAGE}
          rules={[{ required: true }]}
          initialValue={60}
        >
          <InputNumber maxLength={3} min={1} max={100} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

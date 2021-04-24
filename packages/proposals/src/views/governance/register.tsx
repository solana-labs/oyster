import React, { useState } from 'react';
import { Button, ButtonProps, InputNumber, Modal, Switch } from 'antd';
import { Form, Input, Select } from 'antd';
import { PublicKey } from '@solana/web3.js';
import {
  CONFIG_NAME_LENGTH,
  ExecutionType,
  GovernanceType,
  VotingEntryRule,
} from '../../models/governance';
import { LABELS } from '../../constants';
import { contexts, utils, tryParseKey } from '@oyster/common';
import { registerProgramGovernance } from '../../actions/registerProgramGovernance';
import { Redirect } from 'react-router';
import BN from 'bn.js';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { Option } = Select;
const { notify } = utils;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

export function RegisterGovernanceMenuItem(props: ButtonProps) {
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
      <NewForm
        handleOk={handleOk}
        handleCancel={handleCancel}
        isModalVisible={isModalVisible}
      />
    </>
  );
}

export function NewForm({
  handleOk,
  handleCancel,
  isModalVisible,
}: {
  handleOk: (a: PublicKey) => void;
  handleCancel: () => void;
  isModalVisible: boolean;
}) {
  const [form] = Form.useForm();
  const [councilVisible, setCouncilVisible] = useState(false);
  const wallet = useWallet();
  const connection = useConnection();
  const onFinish = async (values: {
    timelockType: GovernanceType;
    executionType: ExecutionType;
    voteThreshold: number;
    votingEntryRule: VotingEntryRule;
    minimumSlotWaitingPeriod: string;
    timeLimit: string;
    governanceMint: string;
    councilMint: string;
    program: string;
    name: string;
  }) => {
    if (!values.minimumSlotWaitingPeriod.match(/^\d*$/)) {
      notify({
        message: LABELS.MIN_SLOT_MUST_BE_NUMERIC,
        type: 'error',
      });
      return;
    }
    if (!values.timeLimit.match(/^\d*$/)) {
      notify({
        message: LABELS.TIME_LIMIT_MUST_BE_NUMERIC,
        type: 'error',
      });
      return;
    }
    if (!tryParseKey(values.program)) {
      notify({
        message: LABELS.PROGRAM_ID_IS_NOT_A_VALID_PUBLIC_KEY(values.program),
        type: 'error',
      });
      return;
    }
    if (values.governanceMint && !tryParseKey(values.governanceMint)) {
      notify({
        message: LABELS.GOVERNANCE_MINT_IS_NOT_A_VALID_PUBLIC_KEY(
          values.governanceMint,
        ),
        type: 'error',
      });
      return;
    }
    if (values.councilMint && !tryParseKey(values.councilMint)) {
      notify({
        message: LABELS.COUNCIL_MINT_IS_NOT_A_VALID_PUBLIC_KEY(
          values.councilMint,
        ),
        type: 'error',
      });
      return;
    }

    const uninitializedConfig = {
      timelockType: values.timelockType,
      executionType: values.executionType,
      voteThreshold: values.voteThreshold,
      votingEntryRule: values.votingEntryRule,
      minimumSlotWaitingPeriod: new BN(values.minimumSlotWaitingPeriod),
      governanceMint: values.governanceMint
        ? new PublicKey(values.governanceMint)
        : undefined,
      councilMint: values.councilMint
        ? new PublicKey(values.councilMint)
        : undefined,

      program: new PublicKey(values.program),
      name: values.name,
      timeLimit: new BN(values.timeLimit),
    };

    const newConfig = await registerProgramGovernance(
      connection,
      wallet.wallet,
      uninitializedConfig,
      councilVisible,
    );
    handleOk(newConfig);
  };
  return (
    <Modal
      title={LABELS.REGISTER_GOVERNANCE}
      visible={isModalVisible}
      onOk={form.submit}
      onCancel={handleCancel}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input maxLength={CONFIG_NAME_LENGTH} />
        </Form.Item>
        <Form.Item
          name="program"
          label={LABELS.PROGRAM_ID}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="governanceMint"
          label={LABELS.GOVERNANCE_MINT}
          rules={[{ required: false }]}
        >
          <Input placeholder={LABELS.LEAVE_BLANK_IF_YOU_WANT_ONE} />
        </Form.Item>
        <Form.Item label={LABELS.USE_COUNCIL_MINT}>
          <Switch onChange={setCouncilVisible} defaultChecked={false} />
        </Form.Item>
        {councilVisible && (
          <Form.Item
            name="councilMint"
            label={LABELS.COUNCIL_MINT}
            rules={[{ required: false }]}
          >
            <Input placeholder={LABELS.LEAVE_BLANK_IF_YOU_WANT_ONE} />
          </Form.Item>
        )}
        <Form.Item
          name="minimumSlotWaitingPeriod"
          label={LABELS.MINIMUM_SLOT_WAITING_PERIOD}
          rules={[{ required: true }]}
        >
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="timeLimit"
          label={LABELS.TIME_LIMIT}
          rules={[{ required: true }]}
        >
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="voteThreshold"
          label={LABELS.VOTE_PERCENT_THRESHOLD}
          rules={[{ required: true }]}
          initialValue={60}
        >
          <InputNumber maxLength={3} min={1} max={100} />
        </Form.Item>
        <Form.Item
          name="executionType"
          label={LABELS.EXECUTION_TYPE}
          rules={[{ required: true }]}
          initialValue={ExecutionType.Independent}
        >
          <Select placeholder={LABELS.SELECT_EXECUTION_TYPE}>
            <Option value={ExecutionType.Independent}>Independent</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="timelockType"
          label={LABELS.PROPOSAL_TYPE}
          rules={[{ required: true }]}
          initialValue={GovernanceType.Governance}
        >
          <Select placeholder={LABELS.SELECT_PROPOSAL_TYPE}>
            <Option value={GovernanceType.Governance}>Single Signer</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="votingEntryRule"
          label={LABELS.VOTING_ENTRY_RULES}
          rules={[{ required: true }]}
          initialValue={VotingEntryRule.Anytime}
        >
          <Select placeholder={LABELS.SELECT_VOTING_ENTRY_RULE}>
            <Option value={VotingEntryRule.Anytime}>At any time</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

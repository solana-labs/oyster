import React, { useState } from 'react';
import { Modal } from 'antd';
import { Form, Input, Select } from 'antd';
import { Account } from '@solana/web3.js';
import {
  ConsensusAlgorithm,
  DESC_SIZE,
  ExecutionType,
  NAME_SIZE,
  TimelockType,
} from '../../models/timelock';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants';
import { contexts } from '@oyster/common';
import { createProposal } from '../../actions/createProposal';
import { Redirect } from 'react-router';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { Option } = Select;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

export function NewFormMenuItem() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [redirect, setRedirect] = useState('');
  const handleOk = (a: Account) => {
    setIsModalVisible(false);
    setRedirect(a.publicKey.toBase58());
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (redirect) {
    setTimeout(() => setRedirect(''), 100);
    return <Redirect push to={'/proposal/' + redirect} />;
  }

  return (
    <>
      <Link
        to={{
          pathname: '/',
        }}
        onClick={() => setIsModalVisible(true)}
      >
        {LABELS.NEW_PROPOSAL}
      </Link>
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
  handleOk: (a: Account) => void;
  handleCancel: () => void;
  isModalVisible: boolean;
}) {
  const [form] = Form.useForm();
  const wallet = useWallet();
  const connection = useConnection();
  const onFinish = async (values: {
    name: string;
    description: string;
    timelockType: TimelockType;
    executionType: ExecutionType;
    consensusAlgorithm: ConsensusAlgorithm;
  }) => {
    const newSet = await createProposal(
      connection,
      wallet.wallet,
      values.name,
      values.description,
      values.timelockType,
      values.consensusAlgorithm,
      values.executionType,
    );
    handleOk(newSet);
  };
  return (
    <Modal
      title="New Proposal"
      visible={isModalVisible}
      onOk={form.submit}
      onCancel={handleCancel}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input maxLength={NAME_SIZE} />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true }]}
        >
          <Input maxLength={DESC_SIZE} placeholder="Github Gist link" />
        </Form.Item>
        <Form.Item
          name="consensusAlgorithm"
          label="Consensus Algorithm"
          rules={[{ required: true }]}
          initialValue={ConsensusAlgorithm.Majority}
        >
          <Select placeholder="Select the Consensus Algorithm">
            <Option value={ConsensusAlgorithm.Majority}>Majority</Option>
            <Option value={ConsensusAlgorithm.FullConsensus}>
              Full Consensus
            </Option>
            <Option value={ConsensusAlgorithm.SuperMajority}>
              Super Majority
            </Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="executionType"
          label="Execution Type"
          rules={[{ required: true }]}
          initialValue={ExecutionType.AnyAboveVoteFinishSlot}
        >
          <Select placeholder="Select the type of execution">
            <Option value={ExecutionType.AnyAboveVoteFinishSlot}>
              Any Above Vote Finish Slot
            </Option>
            <Option value={ExecutionType.AllOrNothing}>All or Nothing</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="timelockType"
          label="Proposal Type"
          rules={[{ required: true }]}
          initialValue={TimelockType.CustomSingleSignerV1}
        >
          <Select placeholder="Select the type of Proposal">
            <Option value={TimelockType.CustomSingleSignerV1}>
              Single Signer
            </Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

import React, { useState } from 'react';
import { Modal } from 'antd';
import { Form, Input, Select } from 'antd';
import { Account } from '@solana/web3.js';
import {
  ConsensusAlgorithm,
  DESC_SIZE,
  NAME_SIZE,
} from '../../models/timelock';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants';
import { contexts } from '@oyster/common';
import { createProposal } from '../../actions/createProposal';
import { Redirect } from 'react-router';
import { useProposals } from '../../contexts/proposals';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { Option } = Select;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

export function NewProposalMenuItem() {
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
  const context = useProposals();
  const configs = Object.values(context.configs);

  const onFinish = async (values: {
    name: string;
    description: string;
    timelockConfigKey: string;
  }) => {
    const config = context.configs[values.timelockConfigKey];
    const newSet = await createProposal(
      connection,
      wallet.wallet,
      values.name,
      values.description,
      config,
    );
    handleOk(newSet);
  };
  return (
    <Modal
      title={LABELS.NEW_PROPOSAL}
      visible={isModalVisible}
      onOk={form.submit}
      onCancel={handleCancel}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="name" label={LABELS.NAME} rules={[{ required: true }]}>
          <Input maxLength={NAME_SIZE} />
        </Form.Item>
        <Form.Item
          name="description"
          label={LABELS.DESCRIPTION}
          rules={[{ required: true }]}
        >
          <Input maxLength={DESC_SIZE} placeholder={LABELS.GIST_PLACEHOLDER} />
        </Form.Item>
        <Form.Item
          name="timelockConfigKey"
          label={LABELS.CONFIG}
          rules={[{ required: true }]}
        >
          <Select placeholder={LABELS.SELECT_CONFIG}>
            {configs.map(c => (
              <Option value={c.pubkey.toBase58()}>{c.info.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

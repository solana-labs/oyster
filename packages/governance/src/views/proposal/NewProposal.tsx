import React, { useState } from 'react';
import { Button, ButtonProps, Modal, Radio } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';
import { DESC_SIZE, NAME_SIZE } from '../../models/serialisation';
import { LABELS } from '../../constants';
import { contexts } from '@oyster/common';
import { createProposal } from '../../actions/createProposal';
import { Redirect } from 'react-router';

import { GoverningTokenType } from '../../models/enums';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function NewProposal(props: ButtonProps) {
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
    return <Redirect push to={'/proposal/' + redirect} />;
  }

  return (
    <>
      <Button onClick={() => setIsModalVisible(true)} {...props}>
        {LABELS.NEW_PROPOSAL}
      </Button>
      <NewProposalForm
        handleOk={handleOk}
        handleCancel={handleCancel}
        isModalVisible={isModalVisible}
      />
    </>
  );
}

export function NewProposalForm({
  handleOk,
  handleCancel,
  isModalVisible,
}: {
  handleOk: (a: PublicKey) => void;
  handleCancel: () => void;
  isModalVisible: boolean;
}) {
  const [form] = Form.useForm();
  const wallet = useWallet();
  const connection = useConnection();

  const onFinish = async (values: {
    name: string;
    descriptionLink: string;
    governingTokenType: GoverningTokenType;
  }) => {
    const governingTokenMint = new PublicKey(
      '96FzwVB3khGLWf7Wz1bWCV3jH53ebU7FyUYQd4PYbBAH',
    );

    const realm = new PublicKey('EBtaPjFZ4TUbDiZZAu99soRD5FKq7P8LeA6B6kePZ88x');

    const governance = new PublicKey(
      'AcJZR2Y41c8YVDFCuxruUCSmxA9oG6Hfq9okyuXpHMeN',
    );

    const proposalIndex = 0;

    const proposalAddress = await createProposal(
      connection,
      wallet.wallet,
      realm,
      governance,
      values.name,
      values.descriptionLink,
      governingTokenMint,
      proposalIndex,
    );
    handleOk(proposalAddress);
  };

  const layout = {
    labelCol: { span: 24 },
    wrapperCol: { span: 24 },
  };

  return (
    <Modal
      title={LABELS.NEW_PROPOSAL}
      visible={isModalVisible}
      onOk={form.submit}
      onCancel={handleCancel}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item
          label={LABELS.WHO_VOTES_QUESTION}
          name="governingTokenType"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value={GoverningTokenType.Community}>
              {LABELS.COMMUNITY_TOKEN_HOLDERS}
            </Radio.Button>
            <Radio.Button value={GoverningTokenType.Council}>
              {LABELS.COUNCIL}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="name"
          label={LABELS.NAME_LABEL}
          rules={[{ required: true }]}
        >
          <Input maxLength={NAME_SIZE} />
        </Form.Item>
        <Form.Item
          name="descriptionLink"
          label={LABELS.DESCRIPTION_LABEL}
          rules={[{ required: true }]}
        >
          <Input maxLength={DESC_SIZE} placeholder={LABELS.GIST_PLACEHOLDER} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

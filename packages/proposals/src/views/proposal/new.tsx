import React, { useState } from 'react';
import { Button, ButtonProps, Modal, Radio } from 'antd';
import { Form, Input, Select } from 'antd';
import { Account } from '@solana/web3.js';
import { DESC_SIZE, NAME_SIZE, ZERO_KEY } from '../../models/timelock';
import { LABELS } from '../../constants';
import { contexts, utils } from '@oyster/common';
import { createProposal } from '../../actions/createProposal';
import { Redirect } from 'react-router';
import { useProposals } from '../../contexts/proposals';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { Option } = Select;
const { notify } = utils;

enum ProposalMintType {
  Governance = 'governance',
  Council = 'council',
}

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

export function NewProposalMenuItem(props: ButtonProps) {
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
      <Button onClick={() => setIsModalVisible(true)} {...props}>
        {LABELS.NEW_PROPOSAL}
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
    proposalMintType: string;
    description: string;
    timelockConfigKey: string;
  }) => {
    const config = context.configs[values.timelockConfigKey];

    if (
      values.proposalMintType === ProposalMintType.Council &&
      config.info.councilMint.toBase58() === ZERO_KEY
    ) {
      notify({
        message: LABELS.THIS_CONFIG_LACKS_COUNCIL,
        type: 'error',
      });
      return;
    }

    const newSet = await createProposal(
      connection,
      wallet.wallet,
      values.name,
      values.description,
      values.proposalMintType === ProposalMintType.Governance,
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
        <Form.Item
          label={LABELS.PROPOSAL_MINT_TYPE}
          name="proposalMintType"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value={ProposalMintType.Governance}>
              {LABELS.GOVERNANCE}
            </Radio.Button>
            <Radio.Button value={ProposalMintType.Council}>
              {LABELS.COUNCIL}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
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

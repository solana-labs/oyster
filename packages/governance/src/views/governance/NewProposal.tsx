import React, { useState } from 'react';
import { Button, ButtonProps, Modal, Radio } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';
import { DESC_SIZE, NAME_SIZE } from '../../models/serialisation';
import { LABELS } from '../../constants';
import { contexts, ParsedAccount } from '@oyster/common';
import { createProposal } from '../../actions/createProposal';
import { Redirect } from 'react-router';

import { GoverningTokenType } from '../../models/enums';
import { Governance } from '../../models/accounts';
import {
  useRealm,
  useTokenOwnerRecord,
} from '../../contexts/GovernanceContext';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function NewProposal({
  props,
  governance,
}: {
  props: ButtonProps;
  governance?: ParsedAccount<Governance>;
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [redirect, setRedirect] = useState('');
  const tokenOwnerRecord = useTokenOwnerRecord(governance?.info.config.realm);

  if (!governance) {
    return null;
  }

  const isDisabled =
    (tokenOwnerRecord?.info.governingTokenDepositAmount.toNumber() ?? 0) <
    governance.info.config.minTokensToCreateProposal;

  const handleOk = (a: PublicKey) => {
    setIsModalVisible(false);
    setRedirect(a.toBase58());
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (redirect) {
    return <Redirect push to={'/proposal/' + redirect} />;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalVisible(true)}
        {...props}
        disabled={isDisabled}
      >
        {LABELS.NEW_PROPOSAL}
      </Button>
      <NewProposalForm
        handleOk={handleOk}
        handleCancel={handleCancel}
        isModalVisible={isModalVisible}
        governance={governance!}
      />
    </>
  );
}

export function NewProposalForm({
  handleOk,
  handleCancel,
  isModalVisible,
  governance,
}: {
  handleOk: (a: PublicKey) => void;
  handleCancel: () => void;
  isModalVisible: boolean;
  governance: ParsedAccount<Governance>;
}) {
  const [form] = Form.useForm();
  const wallet = useWallet();
  const connection = useConnection();
  const realm = useRealm(governance.info.config.realm);

  const onFinish = async (values: {
    name: string;
    descriptionLink: string;
    governingTokenType: GoverningTokenType;
  }) => {
    const governingTokenMint = realm!.info.communityMint;
    const proposalIndex = governance.info.proposalCount;

    try {
      const proposalAddress = await createProposal(
        connection,
        wallet.wallet,
        governance.info.config.realm,
        governance.pubkey,
        values.name,
        values.descriptionLink,
        governingTokenMint,
        proposalIndex,
      );
      handleOk(proposalAddress);
    } catch {
      handleCancel();
    }
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

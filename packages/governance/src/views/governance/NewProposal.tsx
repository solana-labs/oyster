import React, { useState } from 'react';
import { Button, ButtonProps, Modal, Radio } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';
import {
  MAX_PROPOSAL_DESCRIPTION_LENGTH,
  MAX_PROPOSAL_NAME_LENGTH,
} from '../../models/serialisation';
import { LABELS } from '../../constants';
import { contexts, ParsedAccount } from '@oyster/common';
import { createProposal } from '../../actions/createProposal';
import { Redirect } from 'react-router';

import { GoverningTokenType } from '../../models/enums';
import { Governance, Realm } from '../../models/accounts';
import {
  useRealm,
  useWalletTokenOwnerRecord,
} from '../../contexts/GovernanceContext';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function NewProposal({
  props,
  realm,
  governance,
}: {
  props: ButtonProps;
  realm: ParsedAccount<Realm> | undefined;
  governance?: ParsedAccount<Governance>;
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [redirect, setRedirect] = useState('');
  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.info.config.realm,
    realm?.info.communityMint,
  );
  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.info.config.realm,
    realm?.info.councilMint,
  );

  if (!governance) {
    return null;
  }

  const canCreateCommunityProposal =
    (communityTokenOwnerRecord?.info.governingTokenDepositAmount.toNumber() ??
      0) >= governance.info.config.minTokensToCreateProposal;

  const canCreateCouncilProposal =
    (councilTokenOwnerRecord?.info.governingTokenDepositAmount.toNumber() ??
      0) >= governance.info.config.minTokensToCreateProposal;

  const isEnabled = canCreateCommunityProposal || canCreateCouncilProposal;

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
        type="primary"
        onClick={() => setIsModalVisible(true)}
        {...props}
        disabled={!isEnabled}
      >
        {LABELS.NEW_PROPOSAL}
      </Button>
      <NewProposalForm
        handleOk={handleOk}
        handleCancel={handleCancel}
        isModalVisible={isModalVisible}
        governance={governance!}
        canCreateCommunityProposal={canCreateCommunityProposal}
        canCreateCouncilProposal={canCreateCouncilProposal}
      />
    </>
  );
}

export function NewProposalForm({
  handleOk,
  handleCancel,
  isModalVisible,
  governance,
  canCreateCommunityProposal,
  canCreateCouncilProposal,
}: {
  handleOk: (a: PublicKey) => void;
  handleCancel: () => void;
  isModalVisible: boolean;
  governance: ParsedAccount<Governance>;
  canCreateCommunityProposal: boolean;
  canCreateCouncilProposal: boolean;
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
    const governingTokenMint =
      values.governingTokenType === undefined ||
      values.governingTokenType === GoverningTokenType.Community
        ? realm!.info.communityMint
        : realm!.info.councilMint!;
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
    } catch (ex) {
      console.error(ex);
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
      <Form
        {...layout}
        form={form}
        name="control-hooks"
        onFinish={onFinish}
        initialValues={{
          governingTokenType: canCreateCommunityProposal
            ? GoverningTokenType.Community
            : GoverningTokenType.Council,
        }}
      >
        {realm?.info.councilMint && (
          <Form.Item
            label={LABELS.WHO_VOTES_QUESTION}
            name="governingTokenType"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              {canCreateCommunityProposal && (
                <Radio.Button value={GoverningTokenType.Community}>
                  {LABELS.COMMUNITY_TOKEN_HOLDERS}
                </Radio.Button>
              )}
              {canCreateCouncilProposal && (
                <Radio.Button value={GoverningTokenType.Council}>
                  {LABELS.COUNCIL}
                </Radio.Button>
              )}
            </Radio.Group>
          </Form.Item>
        )}

        <Form.Item
          name="name"
          label={LABELS.NAME_LABEL}
          rules={[{ required: true }]}
        >
          <Input maxLength={MAX_PROPOSAL_NAME_LENGTH} />
        </Form.Item>
        <Form.Item
          name="descriptionLink"
          label={LABELS.DESCRIPTION_LABEL}
          rules={[{ required: true }]}
        >
          <Input
            maxLength={MAX_PROPOSAL_DESCRIPTION_LENGTH}
            placeholder={LABELS.GIST_PLACEHOLDER}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

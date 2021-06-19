import React, { useState } from 'react';
import { ButtonProps, Radio } from 'antd';
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

import { useWalletTokenOwnerRecord } from '../../hooks/apiHooks';
import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function AddNewProposal({
  realm,
  governance,
  buttonProps,
}: {
  realm: ParsedAccount<Realm> | undefined;
  governance: ParsedAccount<Governance> | undefined;
  buttonProps?: ButtonProps;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const connection = useConnection();
  const { wallet } = useWallet();

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

  const onSubmit = async (values: {
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

    return await createProposal(
      connection,
      wallet,
      governance.info.config.realm,
      governance.pubkey,
      values.name,
      values.descriptionLink,
      governingTokenMint,
      proposalIndex,
    );
  };

  const onComplete = (pk: PublicKey) => {
    setRedirectTo(pk.toBase58());
  };

  if (redirectTo) {
    return <Redirect push to={'/proposal/' + redirectTo} />;
  }

  return (
    <ModalFormAction<PublicKey>
      label={LABELS.ADD_NEW_PROPOSAL}
      buttonProps={{ ...buttonProps, disabled: !isEnabled, type: 'primary' }}
      formTitle={LABELS.ADD_NEW_PROPOSAL}
      formAction={LABELS.ADD_PROPOSAL}
      formPendingAction={LABELS.ADDING_PROPOSAL}
      onSubmit={onSubmit}
      onComplete={onComplete}
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
    </ModalFormAction>
  );
}

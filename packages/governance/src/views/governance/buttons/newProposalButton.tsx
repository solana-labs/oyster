import React, { useState } from 'react';
import { ButtonProps, Radio } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../../constants';
import { ParsedAccount } from '@oyster/common';
import { createProposal } from '../../../actions/createProposal';
import { Redirect } from 'react-router';

import { GoverningTokenType } from '../../../models/enums';
import { Governance, Realm } from '../../../models/accounts';

import { useWalletTokenOwnerRecord } from '../../../hooks/apiHooks';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import BN from 'bn.js';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { getProposalUrl } from '../../../tools/routeTools';

export function NewProposalButton({
  realm,
  governance,
  buttonProps,
}: {
  realm: ParsedAccount<Realm> | undefined;
  governance: ParsedAccount<Governance> | undefined;
  buttonProps?: ButtonProps;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.info.realm,
    realm?.info.communityMint,
  );
  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.info.realm,
    realm?.info.config.councilMint,
  );

  if (!governance) {
    return null;
  }

  const canCreateProposalUsingCommunityTokens =
    communityTokenOwnerRecord &&
    communityTokenOwnerRecord.info.governingTokenDepositAmount.cmp(
      new BN(governance?.info.config.minCommunityTokensToCreateProposal),
    ) >= 0;

  const canCreateProposalUsingCouncilTokens =
    councilTokenOwnerRecord &&
    councilTokenOwnerRecord.info.governingTokenDepositAmount.cmp(
      new BN(governance?.info.config.minCouncilTokensToCreateProposal),
    ) >= 0;

  const canCreateProposal =
    canCreateProposalUsingCommunityTokens ||
    canCreateProposalUsingCouncilTokens;

  const onSubmit = async (values: {
    name: string;
    descriptionLink: string;
    governingTokenType: GoverningTokenType;
  }) => {
    const governingTokenMint =
      values.governingTokenType === undefined ||
      values.governingTokenType === GoverningTokenType.Community
        ? realm!.info.communityMint
        : realm!.info.config.councilMint!;
    const proposalIndex = governance.info.proposalCount;

    // By default we select communityTokenOwnerRecord as the proposal owner and it doesn't exist then councilTokenOwnerRecord
    // When governance delegates are not used it doesn't make any difference
    // However once the delegates are introduced in the UI then user should choose the proposal owner in the ui
    // because user might have different delegates for council and community
    const tokenOwnerRecord = canCreateProposalUsingCommunityTokens
      ? communityTokenOwnerRecord
      : councilTokenOwnerRecord;

    return await createProposal(
      rpcContext,
      governance.info.realm,
      governance.pubkey,
      tokenOwnerRecord!.pubkey,
      values.name,
      values.descriptionLink ?? '',
      governingTokenMint,
      proposalIndex,
    );
  };

  const onComplete = (pk: PublicKey) => {
    setRedirectTo(pk.toBase58());
  };

  if (redirectTo) {
    return <Redirect push to={getProposalUrl(redirectTo, programId)} />;
  }

  return (
    <ModalFormAction<PublicKey>
      label={LABELS.ADD_NEW_PROPOSAL}
      buttonProps={{
        ...buttonProps,
        disabled: !canCreateProposal,
        type: 'primary',
      }}
      formTitle={LABELS.ADD_NEW_PROPOSAL}
      formAction={LABELS.ADD_PROPOSAL}
      formPendingAction={LABELS.ADDING_PROPOSAL}
      onSubmit={onSubmit}
      onComplete={onComplete}
      initialValues={{
        governingTokenType: GoverningTokenType.Community,
      }}
    >
      {realm?.info.config.councilMint && (
        <Form.Item
          label={LABELS.WHO_VOTES_QUESTION}
          name="governingTokenType"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value={GoverningTokenType.Community}>
              {LABELS.COMMUNITY_TOKEN_HOLDERS}
            </Radio.Button>

            {realm.info.config.councilMint && (
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
        <Input />
      </Form.Item>
      <Form.Item
        name="descriptionLink"
        label={LABELS.DESCRIPTION_LABEL}
        rules={[{ required: false }]}
      >
        <Input placeholder={LABELS.GIST_PLACEHOLDER} />
      </Form.Item>
    </ModalFormAction>
  );
}

import React, { useState } from 'react';
import { ButtonProps, Radio } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../constants';
import { ParsedAccount } from '@oyster/common';
import { createProposal } from '../../actions/createProposal';
import { Redirect } from 'react-router';

import { GoverningTokenType } from '../../models/enums';
import { Governance, Realm, TokenOwnerRecord } from '../../models/accounts';

import { useWalletTokenOwnerRecord } from '../../hooks/apiHooks';
import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';
import BN from 'bn.js';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getProposalUrl } from '../../tools/routeTools';

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
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.info.realm,
    realm?.info.communityMint,
  );
  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.info.realm,
    realm?.info.councilMint,
  );

  if (!governance) {
    return null;
  }

  const canCreateProposal = (
    tokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined,
  ) =>
    tokenOwnerRecord &&
    tokenOwnerRecord.info.governingTokenDepositAmount.cmp(
      new BN(governance?.info.config.minTokensToCreateProposal),
    ) >= 0;

  const canCreateCommunityProposal = canCreateProposal(
    communityTokenOwnerRecord,
  );

  const canCreateCouncilProposal = canCreateProposal(councilTokenOwnerRecord);

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
      rpcContext,
      governance.info.realm,
      governance.pubkey,
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

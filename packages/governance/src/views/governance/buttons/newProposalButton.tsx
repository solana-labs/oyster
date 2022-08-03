import React, { useState } from 'react';
import { ButtonProps, Radio } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../../constants';
import { useMint } from '@oyster/common';
import { createProposal } from '../../../actions/createProposal';
import { Redirect } from 'react-router';

import { GoverningTokenType } from '@solana/spl-governance';
import { Governance, Realm } from '@solana/spl-governance';

import { useWalletTokenOwnerRecord, useVoterWeightRecord } from '../../../hooks/apiHooks';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import BN from 'bn.js';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { getProposalUrl } from '../../../tools/routeTools';
import { ProgramAccount } from '@solana/spl-governance';

export function NewProposalButton({
  realm,
  governance,
  buttonProps,
}: {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance> | undefined;
  buttonProps?: ButtonProps;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.account.realm,
    realm?.account.communityMint,
  );

  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.account.realm,
    realm?.account.config.councilMint,
  );

  const communityMint = useMint(realm?.account.communityMint);

  const voterWeightRecord = useVoterWeightRecord(realm, governance);

  if (!governance || !communityMint || !realm) {
    return null;
  }

  const canCreateProposalUsingCommunityTokens =
    communityTokenOwnerRecord &&
    communityTokenOwnerRecord.account.governingTokenDepositAmount.cmp(
      new BN(governance?.account.config.minCommunityTokensToCreateProposal),
    ) >= 0;

  const canCreateProposalUsingCouncilTokens =
    councilTokenOwnerRecord &&
    councilTokenOwnerRecord.account.governingTokenDepositAmount.cmp(
      new BN(governance?.account.config.minCouncilTokensToCreateProposal),
    ) >= 0;

  const canCreateProposalUsingVoterWeight =
    voterWeightRecord && !voterWeightRecord.voterWeight.account.voterWeight.isZero();

  const canCreateProposal =
    canCreateProposalUsingCommunityTokens ||
    canCreateProposalUsingCouncilTokens ||
    canCreateProposalUsingVoterWeight;

  // human readable reason why proposal can't be created
  let creationDisabledReason = undefined;
  if (!canCreateProposal) {
    creationDisabledReason = LABELS.PROPOSAL_CANT_ADD_BELOW_LIMIT;
    if (voterWeightRecord && voterWeightRecord.voterWeight.account.voterWeight.isZero()){
      creationDisabledReason = LABELS.PROPOSAL_CANT_ADD_EMPTY;
    }
  }

  const defaultGoverningTokenType = !communityMint.supply.isZero()
    ? GoverningTokenType.Community
    : GoverningTokenType.Council;

  const showTokenChoice =
    !communityMint.supply.isZero() && realm?.account.config.councilMint;

  const onSubmit = async (values: {
    name: string;
    descriptionLink: string;
    governingTokenType: GoverningTokenType;
  }) => {
    const governingTokenMint = realm!.account.communityMint;
    const proposalIndex = governance.account.proposalCount;

    // By default we select communityTokenOwnerRecord as the proposal owner and it doesn't exist then councilTokenOwnerRecord
    // When governance delegates are not used it doesn't make any difference
    // However once the delegates are introduced in the UI then user should choose the proposal owner in the ui
    // because user might have different delegates for council and community
    const tokenOwnerRecord = communityTokenOwnerRecord;

    return await createProposal(
      rpcContext,
      governance.account.realm,
      governance.pubkey,
      tokenOwnerRecord!.pubkey,
      values.name,
      values.descriptionLink ?? '',
      governingTokenMint,
      proposalIndex,
      voterWeightRecord?.voterWeight.pubkey,
      voterWeightRecord?.maxVoterWeight.pubkey,
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
      buttonTooltip={creationDisabledReason}
      formTitle={LABELS.ADD_NEW_PROPOSAL}
      formAction={LABELS.ADD_PROPOSAL}
      formPendingAction={LABELS.ADDING_PROPOSAL}
      onSubmit={onSubmit}
      onComplete={onComplete}
      initialValues={{
        governingTokenType: defaultGoverningTokenType,
      }}
    >
      {showTokenChoice && (
        <Form.Item
          label={LABELS.WHO_VOTES_QUESTION}
          name="governingTokenType"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value={GoverningTokenType.Community}>
              {LABELS.COMMUNITY_TOKEN_HOLDERS}
            </Radio.Button>

            {realm.account.config.councilMint && (
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

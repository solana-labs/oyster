import React, {useMemo, useState} from 'react';
import {ButtonProps, Form, Input, Radio} from 'antd';
import {PublicKey, TransactionInstruction} from '@solana/web3.js';
import {
  Governance,
  GoverningTokenType,
  ProgramAccount,
  Realm,
  withCreateTokenOwnerRecord
} from '@solana/spl-governance';
import {useMint, useNativeAccount} from '@oyster/common';
import {Redirect} from 'react-router';
import BN from 'bn.js';

import {LABELS} from '../../../constants';
import {createProposal} from '../../../actions/createProposal';
import {
  useRealmConfig,
  useVoterWeightRecord,
  useWalletTokenOwnerRecord
} from '../../../hooks/apiHooks';
import {ModalFormAction} from '../../../components/ModalFormAction/modalFormAction';
import {useRpcContext} from '../../../hooks/useRpcContext';
import {getProposalUrl} from '../../../tools/routeTools';


export interface NeonProposalButtonProps {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance> | undefined;
  buttonProps?: ButtonProps;
}

export function NewProposalButton(props: NeonProposalButtonProps) {
  const { realm, governance, buttonProps } = props;
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;
  const [redirectTo, setRedirectTo] = useState('');
  const { account } = useNativeAccount();

  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.account.realm,
    realm?.account.communityMint
  );

  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    governance?.account.realm,
    realm?.account.config.councilMint
  );

  const realmConfig = useRealmConfig(governance?.account.realm);
  const communityVoterWeightAddin = realmConfig?.account.communityVoterWeightAddin;

  const communityMint = useMint(realm?.account.communityMint);

  const { voterWeight, maxVoterWeight } = useVoterWeightRecord(realm, governance);

  // const canCreateProposalUsingCommunityTokens = useMemo(() => {
  //   if (communityTokenOwnerRecord && governance) {
  //     const mint = new BN(governance.account.config.minCommunityTokensToCreateProposal);
  //
  //     return communityTokenOwnerRecord.account.governingTokenDepositAmount.cmp(mint) >= 0;
  //   }
  //   return false;
  // }, [communityTokenOwnerRecord, governance]);

  const canCreateProposalUsingCommunityTokens = useMemo(() => {
    if (voterWeight && governance) {
      const mint = new BN(governance.account.config.minCommunityTokensToCreateProposal);

      return voterWeight.account.voterWeight.cmp(mint) >= 0;
    }
    return false;
  }, [voterWeight, governance]);

  //TODO: refactor in right mode
  const canCreateProposalUsingCouncilTokens = useMemo(() => {
    if (councilTokenOwnerRecord && governance) {
      const mint = new BN(governance?.account.config.minCouncilTokensToCreateProposal);
      return councilTokenOwnerRecord.account.governingTokenDepositAmount.cmp(mint) >= 0;
    }
    return false;
  }, [councilTokenOwnerRecord, governance]);

  const hasLamports = useMemo(() => {
    if (account) {
      return !new BN(account.lamports ?? 0).isZero();
    }
    return false;
  }, [account]);

  const canCreateProposalUsingVoterWeight = !voterWeight?.account.voterWeight.isZero();

  const canCreateProposal = hasLamports && canCreateProposalUsingVoterWeight && (canCreateProposalUsingCommunityTokens ||
    canCreateProposalUsingCouncilTokens);

  if (!governance || !communityMint || !realm) {
    return null;
  }

  // human readable reason why proposal can't be created
  let creationDisabledReason = undefined;
  if (!canCreateProposal) {
    creationDisabledReason = LABELS.PROPOSAL_CANT_ADD_BELOW_LIMIT;
    if (voterWeight?.account.voterWeight.isZero()) {
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
    const instructions: TransactionInstruction[] = [];

    // By default we select communityTokenOwnerRecord as the proposal owner and it doesn't exist then councilTokenOwnerRecord
    // When governance delegates are not used it doesn't make any difference
    // However once the delegates are introduced in the UI then user should choose the proposal owner in the ui
    // because user might have different delegates for council and community
    let tokenOwnerRecord = communityTokenOwnerRecord?.pubkey;
    if (!tokenOwnerRecord && canCreateProposalUsingVoterWeight) {
      tokenOwnerRecord = await withCreateTokenOwnerRecord(
        instructions,
        programId,
        realm?.pubkey,
        rpcContext.walletPubkey,
        governingTokenMint,
        rpcContext.walletPubkey
      );
    }

      return await createProposal(
        instructions,
        rpcContext,
        realm,
        governance.pubkey,
        tokenOwnerRecord ?? governance.pubkey,
        values.name,
        values.descriptionLink ?? '',
        governingTokenMint,
        proposalIndex,
        voterWeight?.pubkey,
        maxVoterWeight?.pubkey,
        communityVoterWeightAddin
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
        type: 'primary'
      }}
      buttonTooltip={creationDisabledReason}
      formTitle={LABELS.ADD_NEW_PROPOSAL}
      formAction={LABELS.ADD_PROPOSAL}
      formPendingAction={LABELS.ADDING_PROPOSAL}
      onSubmit={onSubmit}
      onComplete={onComplete}
      initialValues={{
        governingTokenType: defaultGoverningTokenType
      }}
    >
      {showTokenChoice && (
        <Form.Item
          label={LABELS.WHO_VOTES_QUESTION}
          name='governingTokenType'
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
        name='name'
        label={LABELS.NAME_LABEL}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name='descriptionLink'
        label={LABELS.DESCRIPTION_LABEL}
        rules={[{ required: false }]}
      >
        <Input placeholder={LABELS.GIST_PLACEHOLDER} />
      </Form.Item>
    </ModalFormAction>
  );
}

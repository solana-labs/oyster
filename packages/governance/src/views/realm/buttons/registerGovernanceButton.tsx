import React, { useState } from 'react';
import { ButtonProps, Radio, Checkbox } from 'antd';
import { Form } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../../constants';

import { Redirect } from 'react-router';

import { GovernanceType } from '@solana/spl-governance';
import { registerGovernance } from '../../../actions/registerGovernance';

import { useKeyParam } from '../../../hooks/useKeyParam';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';

import { AccountFormItem } from '../../../components/AccountFormItem/accountFormItem';

import { useRpcContext } from '../../../hooks/useRpcContext';
import { getGovernanceUrl } from '../../../tools/routeTools';
import {
  getGovernanceConfig,
  GovernanceConfigFormItem,
  GovernanceConfigValues,
} from '../../../components/governanceConfigFormItem/governanceConfigFormItem';

import { Realm } from '@solana/spl-governance';
import { useWalletTokenOwnerRecord } from '../../../hooks/apiHooks';
import { ProgramAccount } from '@solana/spl-governance';

export function RegisterGovernanceButton({
  buttonProps,
  realm,
}: {
  buttonProps?: ButtonProps;
  realm: ProgramAccount<Realm> | undefined;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const realmKey = useKeyParam();
  const [governanceType, setGovernanceType] = useState(GovernanceType.Account);

  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    realm?.account.communityMint,
  );

  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    realm?.account.config.councilMint,
  );

  if (!realm) {
    return null;
  }

  const canCreateGovernanceUsingCommunityTokens =
    communityTokenOwnerRecord &&
    communityTokenOwnerRecord.account.governingTokenDepositAmount.cmp(
      realm.account.config.minCommunityTokensToCreateGovernance,
    ) >= 0;

  const canCreateGovernanceUsingCouncilTokens =
    councilTokenOwnerRecord &&
    !councilTokenOwnerRecord.account.governingTokenDepositAmount.isZero();

  const tokenOwnerRecord = canCreateGovernanceUsingCouncilTokens
    ? councilTokenOwnerRecord
    : canCreateGovernanceUsingCommunityTokens
      ? communityTokenOwnerRecord
      : undefined;

  const onSubmit = async (
    values: {
      governanceType: GovernanceType;
      governedAccountAddress: string;
      transferAuthority: boolean;
    } & GovernanceConfigValues,
  ) => {
    const config = getGovernanceConfig(values);

    return await registerGovernance(
      rpcContext,
      values.governanceType,
      realmKey,
      new PublicKey(values.governedAccountAddress),
      config,
      values.transferAuthority,
      tokenOwnerRecord!.pubkey,
    );
  };

  const onComplete = (pk: PublicKey) => {
    setRedirectTo(pk.toBase58());
  };

  if (redirectTo) {
    return <Redirect push to={getGovernanceUrl(redirectTo, programId)} />;
  }

  return (
    <ModalFormAction<PublicKey>
      label={LABELS.CREATE_NEW_GOVERNANCE}
      buttonProps={{ disabled: !tokenOwnerRecord }}
      formTitle={LABELS.CREATE_NEW_GOVERNANCE}
      formAction={LABELS.CREATE}
      formPendingAction={LABELS.CREATING}
      onSubmit={onSubmit}
      onComplete={onComplete}
      initialValues={{
        governanceType: GovernanceType.Account,
        transferAuthority: true,
      }}
    >
      <Form.Item label={LABELS.GOVERNANCE_OVER} name="governanceType">
        <Radio.Group onChange={e => setGovernanceType(e.target.value)}>
          <Radio.Button value={GovernanceType.Account}>
            {LABELS.ACCOUNT}
          </Radio.Button>
          <Radio.Button value={GovernanceType.Program}>
            {LABELS.PROGRAM}
          </Radio.Button>
          <Radio.Button value={GovernanceType.Mint}>{LABELS.MINT}</Radio.Button>
          <Radio.Button value={GovernanceType.Token}>
            {LABELS.TOKEN_ACCOUNT}
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <AccountFormItem
        name="governedAccountAddress"
        label={
          governanceType === GovernanceType.Program
            ? LABELS.PROGRAM_ID_LABEL
            : governanceType === GovernanceType.Mint
              ? LABELS.MINT_ADDRESS_LABEL
              : governanceType === GovernanceType.Token
                ? LABELS.TOKEN_ACCOUNT_ADDRESS
                : LABELS.ACCOUNT_ADDRESS
        }
      ></AccountFormItem>

      {(governanceType === GovernanceType.Program ||
        governanceType === GovernanceType.Mint ||
        governanceType === GovernanceType.Token) && (
          <Form.Item
            name="transferAuthority"
            label={`transfer ${governanceType === GovernanceType.Program
                ? LABELS.UPGRADE_AUTHORITY
                : governanceType === GovernanceType.Mint
                  ? LABELS.MINT_AUTHORITY
                  : LABELS.TOKEN_OWNER
              } to governance`}
            valuePropName="checked"
          >
            <Checkbox></Checkbox>
          </Form.Item>
        )}
      <GovernanceConfigFormItem realm={realm}></GovernanceConfigFormItem>
    </ModalFormAction>
  );
}

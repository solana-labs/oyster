import React, { useState } from 'react';
import { ButtonProps, Radio, Checkbox } from 'antd';
import { Form } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../../constants';

import { Redirect } from 'react-router';

import { GovernanceType } from '../../../models/enums';
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
import { ParsedAccount } from '../../../../../common/dist/lib';
import { Realm } from '../../../models/accounts';

export function RegisterGovernanceButton({
  buttonProps,
  realm,
}: {
  buttonProps: ButtonProps;
  realm: ParsedAccount<Realm> | undefined;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const realmKey = useKeyParam();
  const [governanceType, setGovernanceType] = useState(GovernanceType.Account);

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
      label={LABELS.REGISTER_GOVERNANCE}
      buttonProps={buttonProps}
      formTitle={LABELS.REGISTER_GOVERNANCE}
      formAction={LABELS.REGISTER}
      formPendingAction={LABELS.REGISTERING}
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
          label={`transfer ${
            governanceType === GovernanceType.Program
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

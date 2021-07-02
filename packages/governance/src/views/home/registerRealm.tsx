import React, { useState } from 'react';
import { ButtonProps, Switch } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../constants';

import { Redirect } from 'react-router';
import { MintFormItem } from '../../components/MintFormItem/mintFormItem';

import { registerRealm } from '../../actions/registerRealm';

import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getRealmUrl } from '../../tools/routeTools';

export function RegisterRealm({ buttonProps }: { buttonProps: ButtonProps }) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const [councilVisible, setCouncilVisible] = useState(false);

  const onSubmit = async (values: {
    communityMint: string;
    councilMint: string;
    name: string;
    useCouncilMint: boolean;
  }) => {
    return await registerRealm(
      rpcContext,
      values.name,
      new PublicKey(values.communityMint),
      values.useCouncilMint ? new PublicKey(values.councilMint) : undefined,
    );
  };

  const onComplete = (pk: PublicKey) => {
    setRedirectTo(pk.toBase58());
  };

  const onReset = () => {
    setCouncilVisible(false);
  };

  if (redirectTo) {
    return <Redirect push to={getRealmUrl(redirectTo, programId)} />;
  }

  return (
    <ModalFormAction<PublicKey>
      label="Register Realm"
      buttonProps={buttonProps}
      formTitle="Register Realm"
      formAction="Register"
      formPendingAction="Registering"
      onSubmit={onSubmit}
      onComplete={onComplete}
      onReset={onReset}
      initialValues={{ useCouncilMint: false }}
    >
      <Form.Item
        name="name"
        label={LABELS.NAME_LABEL}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <MintFormItem
        name="communityMint"
        label={LABELS.COMMUNITY_TOKEN_MINT}
      ></MintFormItem>
      <Form.Item
        name="useCouncilMint"
        label={LABELS.USE_COUNCIL_TOKEN}
        valuePropName="checked"
      >
        <Switch onChange={setCouncilVisible} />
      </Form.Item>
      {councilVisible && (
        <MintFormItem
          name="councilMint"
          label={LABELS.COUNCIL_TOKEN_MINT}
          required={councilVisible}
        />
      )}
    </ModalFormAction>
  );
}

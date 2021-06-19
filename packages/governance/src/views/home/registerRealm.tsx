import React, { useState } from 'react';
import { ButtonProps, Switch } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';
import { MAX_REALM_NAME_LENGTH } from '../../models/serialisation';
import { LABELS } from '../../constants';
import { contexts } from '@oyster/common';
import { Redirect } from 'react-router';
import { MintFormItem } from '../../components/MintInput/mintFormItem';

import { registerRealm } from '../../actions/registerRealm';

import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function RegisterRealm({ buttonProps }: { buttonProps: ButtonProps }) {
  const [redirectTo, setRedirectTo] = useState('');
  const connection = useConnection();
  const { wallet } = useWallet();
  const [councilVisible, setCouncilVisible] = useState(false);

  const onSubmit = async (values: {
    communityMint: string;
    councilMint: string;
    name: string;
    useCouncilMint: boolean;
  }) => {
    return await registerRealm(
      connection,
      wallet,
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
    return <Redirect push to={'/realm/' + redirectTo} />;
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
        <Input maxLength={MAX_REALM_NAME_LENGTH} />
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

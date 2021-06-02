import React, { useState } from 'react';
import { Button, ButtonProps, Modal, Switch } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';
import { MAX_REALM_NAME_LENGTH } from '../../models/governance';
import { LABELS } from '../../constants';
import { contexts, utils, tryParseKey } from '@oyster/common';
import { Redirect } from 'react-router';

import { registerRealm } from '../../actions/registerRealm';
import { Realm } from '../../models/accounts';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { notify } = utils;

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

export function RegisterRealm(props: ButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [redirect, setRedirect] = useState('');
  const handleOk = (a: PublicKey) => {
    setIsModalVisible(false);
    setRedirect(a.toBase58());
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (redirect) {
    setTimeout(() => setRedirect(''), 100);
    return <Redirect push to={'/realm/' + redirect} />;
  }

  return (
    <>
      <Button onClick={() => setIsModalVisible(true)} {...props}>
        {LABELS.REGISTER_REALM}
      </Button>
      <NewRealmForm
        handleOk={handleOk}
        handleCancel={handleCancel}
        isModalVisible={isModalVisible}
      />
    </>
  );
}

export function NewRealmForm({
  handleOk,
  handleCancel,
  isModalVisible,
}: {
  handleOk: (a: PublicKey) => void;
  handleCancel: () => void;
  isModalVisible: boolean;
}) {
  const [form] = Form.useForm();
  const [councilVisible, setCouncilVisible] = useState(false);
  const wallet = useWallet();
  const connection = useConnection();
  const onFinish = async (values: {
    communityMint: string;
    councilMint: string;
    name: string;
    useCouncilMint: boolean;
  }) => {
    if (values.communityMint && !tryParseKey(values.communityMint)) {
      notify({
        message: LABELS.GOVERNANCE_MINT_IS_NOT_A_VALID_PUBLIC_KEY(
          values.communityMint,
        ),
        type: 'error',
      });
      return;
    }
    if (values.councilMint && !tryParseKey(values.councilMint)) {
      notify({
        message: LABELS.COUNCIL_MINT_IS_NOT_A_VALID_PUBLIC_KEY(
          values.councilMint,
        ),
        type: 'error',
      });
      return;
    }

    const realm: Realm = {
      accountType: 0,
      name: values.name,
      communityMint: new PublicKey(values.communityMint),
      councilMint: values.useCouncilMint
        ? new PublicKey(values.councilMint)
        : null,
    };

    const realmPubkey = await registerRealm(connection, wallet.wallet, realm);

    handleOk(realmPubkey);
  };
  return (
    <Modal
      title={LABELS.REGISTER_REALM}
      visible={isModalVisible}
      onOk={form.submit}
      onCancel={handleCancel}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item
          name="name"
          label={LABELS.NAME_LABEL}
          rules={[{ required: true }]}
        >
          <Input maxLength={MAX_REALM_NAME_LENGTH} />
        </Form.Item>

        <Form.Item
          name="communityMint"
          label={LABELS.COMMUNITY_TOKEN_MINT}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="useCouncilMint" label={LABELS.USE_COUNCIL_TOKEN}>
          <Switch onChange={setCouncilVisible} defaultChecked={false} />
        </Form.Item>
        {councilVisible && (
          <Form.Item
            name="councilMint"
            label={LABELS.COUNCIL_TOKEN_MINT}
            rules={[{ required: councilVisible }]}
          >
            <Input />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

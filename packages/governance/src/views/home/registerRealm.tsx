import React, { useState } from 'react';
import { Alert, Button, ButtonProps, Modal, Switch } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';
import { MAX_REALM_NAME_LENGTH } from '../../models/serialisation';
import { LABELS } from '../../constants';
import { contexts, ExplorerLink } from '@oyster/common';
import { Redirect } from 'react-router';
import { MintFormItem } from '../../components/MintInput/mintFormItem';

import { registerRealm } from '../../actions/registerRealm';

import { formDefaults } from '../../tools/forms';
import { isSendTransactionError, isSignTransactionError } from '@oyster/common';
import { getTransactionErrorMsg } from '../../models/errors';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function RegisterRealm(props: ButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [redirect, setRedirect] = useState('');
  const { connected } = useWallet();

  const handleOk = (a: PublicKey) => {
    setIsModalVisible(false);
    setRedirect(a.toBase58());
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (redirect) {
    return <Redirect push to={'/realm/' + redirect} />;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalVisible(true)}
        {...props}
        disabled={!connected}
      >
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
  const { wallet } = useWallet();
  const connection = useConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<{
      txError?: string;
      txId?: string;
      recoveryAction: string;
      header?: string;
    } | null>();

  const resetForm = () => {
    form.resetFields();
    setCouncilVisible(false);
    setError(null);
  };

  const closeForm = (reset = true) => {
    handleCancel();
    setLoading(false);
    setError(null);
    reset && resetForm();
  };

  const onSubmit = async (values: {
    communityMint: string;
    councilMint: string;
    name: string;
    useCouncilMint: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const realmPubkey = await registerRealm(
        connection,
        wallet,
        values.name,
        new PublicKey(values.communityMint),
        values.useCouncilMint ? new PublicKey(values.councilMint) : undefined,
      );
      handleOk(realmPubkey);
      closeForm();
    } catch (ex) {
      if (isSendTransactionError(ex)) {
        setError({
          txId: ex.txId,
          txError: `${getTransactionErrorMsg(ex)}.`,
          recoveryAction: 'Please try to submit the transaction again.',
        });
      } else if (isSignTransactionError(ex)) {
        setError({
          header: "Couldn't sign the transaction",
          recoveryAction:
            'Please try to submit and sign the transaction with your wallet again.',
        });
      } else {
        setError({
          header: "Couldn't send the transaction",
          recoveryAction: 'Please try to submit the transaction again.',
        });
      }

      setLoading(false);
    }
  };

  const ErrorMessageBanner = () => {
    return error ? (
      <div className="error-message-banner">
        <Alert
          message={
            <>
              {error.txId ? (
                <div>
                  <span>Transaction </span>
                  <ExplorerLink
                    address={error.txId}
                    type="transaction"
                    length={5}
                  />
                  <span> returned an error</span>
                </div>
              ) : (
                error?.header
              )}
            </>
          }
          description={
            <>
              {error.txError && <div>{error.txError}</div>}
              <div>{error.recoveryAction}</div>
            </>
          }
          type="error"
          closable
          banner
          onClose={() => {
            setError(null);
          }}
        />
      </div>
    ) : null;
  };

  return (
    <Modal
      title={LABELS.REGISTER_REALM}
      visible={isModalVisible}
      onCancel={() => closeForm(false)}
      footer={[
        <Button onClick={() => closeForm(!loading)}>
          {loading ? 'Close' : 'Cancel'}
        </Button>,
        <Button onClick={form.submit} loading={loading} type="primary">
          {loading ? 'Registering...' : 'Register'}
        </Button>,
      ]}
    >
      {error && <ErrorMessageBanner></ErrorMessageBanner>}

      <Form
        {...formDefaults}
        form={form}
        onFinish={onSubmit}
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
      </Form>
    </Modal>
  );
}

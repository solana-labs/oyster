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

export function RegisterRealmAction({
  buttonProps,
}: {
  buttonProps: ButtonProps;
}) {
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
      label="Register Realm!!!"
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

export function ModalFormAction<TResult>({
  label,
  formTitle,
  formAction,
  formPendingAction,
  isWalletRequired = true,
  buttonProps,
  onSubmit,
  onComplete,
  onReset,
  children,
  initialValues,
}: {
  label: string;
  formTitle: string;
  formAction: string;
  formPendingAction: string;
  isWalletRequired?: boolean;
  buttonProps: ButtonProps;
  onSubmit: (values: any) => Promise<TResult>;
  onComplete?: (result: TResult) => void;
  onReset?: () => void;
  children: any;
  initialValues?: any;
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { connected } = useWallet();

  const onFormSubmit = (result: TResult) => {
    setIsModalVisible(false);
    onComplete && onComplete(result);
  };
  const onFormCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsModalVisible(true)}
        disabled={isWalletRequired && !connected}
        {...buttonProps}
      >
        {label}
      </Button>
      <ActionForm
        onFormSubmit={onFormSubmit}
        onFormCancel={onFormCancel}
        isModalVisible={isModalVisible}
        onSubmit={onSubmit}
        onReset={onReset}
        formTitle={formTitle}
        formAction={formAction}
        formPendingAction={formPendingAction}
        children={children}
        initialValues={initialValues}
      />
    </>
  );
}

function ActionForm<TResult>({
  onFormSubmit,
  onFormCancel,
  isModalVisible,
  onSubmit,
  onReset,
  formTitle,
  formAction,
  formPendingAction,
  children,
  initialValues,
}: {
  onFormSubmit: (a: TResult) => void;
  onFormCancel: () => void;
  isModalVisible: boolean;
  onSubmit: (values: any) => Promise<TResult>;
  onReset?: () => void;
  formTitle: string;
  formAction: string;
  formPendingAction: string;
  children: any;
  initialValues: any;
}) {
  const [form] = Form.useForm();
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
    onReset && onReset();
    setError(null);
  };

  const closeForm = (reset = true) => {
    onFormCancel();
    setLoading(false);
    setError(null);
    reset && resetForm();
  };

  const onSubmitForm = async (values: any) => {
    try {
      setLoading(true);
      setError(null);

      const result = await onSubmit(values);
      onFormSubmit(result);
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
      title={formTitle}
      visible={isModalVisible}
      onCancel={() => closeForm(false)}
      footer={[
        <Button onClick={() => closeForm(!loading)}>
          {loading ? 'Close' : 'Cancel'}
        </Button>,
        <Button onClick={form.submit} loading={loading} type="primary">
          {loading ? `${formPendingAction}...` : formAction}
        </Button>,
      ]}
    >
      {error && <ErrorMessageBanner></ErrorMessageBanner>}

      <Form
        {...formDefaults}
        form={form}
        onFinish={onSubmitForm}
        initialValues={initialValues}
      >
        {children}
      </Form>
    </Modal>
  );
}

import React, { useState } from 'react';
import { Alert, Button, ButtonProps, Modal, Space, Typography } from 'antd';
import { Form } from 'antd';
import './style.less';
import {
  contexts,
  ExplorerLink,
  isTransactionTimeoutError,
} from '@oyster/common';

import { formDefaults } from '../../tools/forms';
import { isSendTransactionError, isSignTransactionError } from '@oyster/common';
import {
  getTransactionErrorMsg,
  isWalletNotConnectedError,
} from '../../models/errors';

const { Text } = Typography;

const { useWallet } = contexts.Wallet;

/// ModalFormAction is a control displayed as a Button action which opens a Modal from
/// The ModalForm captures common form use cases: 1) Progress indicator, 2) Close/Cancel state management, 3) Submission errors
/// TODO: add version without TResult
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
  buttonProps?: ButtonProps;
  onSubmit: (values: any) => Promise<TResult>;
  onComplete?: (result: TResult) => void;
  onReset?: () => void;
  children?: any;
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
  const [error, setError] = useState<{
    message?: string;
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
          message: `${getTransactionErrorMsg(ex).toString()}`,
          recoveryAction:
            'Please try to amend the inputs and submit the transaction again',
        });
      } else if (isTransactionTimeoutError(ex)) {
        setError({
          txId: ex.txId,
          message: ex.message,
          recoveryAction: 'Please try to submit the transaction again',
        });
      } else if (isSignTransactionError(ex)) {
        setError({
          header: "Couldn't sign the transaction",
          recoveryAction:
            'Please try to submit and sign the transaction with your wallet again',
        });
      } else if (isWalletNotConnectedError(ex)) {
        setError({
          header: "Can't submit the transaction",
          message: ex.message,
          recoveryAction:
            'Please ensure your wallet is connected and submit the transaction again',
        });
      } else {
        setError({
          header: "Can't submit the transaction",
          message: ex.toString(),
          recoveryAction:
            'Please try to amend the inputs and submit the transaction again',
        });
      }
    } finally {
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
              <Space direction="vertical">
                {/* {error.message && <div>{error.message}</div>} */}
                {error.message && <Text type="warning">{error.message}</Text>}

                <Text type="secondary">{error.recoveryAction}</Text>
              </Space>
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

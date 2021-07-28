import { ParsedAccount } from '@oyster/common';
import { Button, Modal, Input, Form, Progress } from 'antd';
import React, { useState } from 'react';
import { utils, contexts, hooks } from '@oyster/common';

import { LABELS } from '../../../../constants';
import { Proposal } from '../../../../models/accounts';

const { notify } = utils;
const { TextArea } = Input;
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

export default function AddSignersButton({
  proposal,
}: {
  proposal: ParsedAccount<Proposal>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const adminAccount = useAccountByMint(proposal.info.governingTokenMint);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [savePerc, setSavePerc] = useState(0);
  const [failedSigners, setFailedSigners] = useState<string[]>([]);
  const [form] = Form.useForm();

  const onSubmit = async (values: {
    signers: string;
    failedSigners: string;
  }) => {
    const signers = values.signers.split(',').map(s => s.trim());
    if (!adminAccount) {
      notify({
        message: LABELS.ADMIN_ACCOUNT_NOT_DEFINED,
        type: 'error',
      });
      return;
    }
    if (!signers.find(s => s)) {
      notify({
        message: LABELS.ENTER_AT_LEAST_ONE_PUB_KEY,
        type: 'error',
      });

      return;
    }
    setSaving(true);

    const failedSignersHold: string[] = [];

    for (let i = 0; i < signers.length; i++) {
      try {
        console.log('TODO:', { wallet, connection });
        // await addSigner(
        //   connection,
        //   wallet.wallet,
        //   null,
        //   state,
        //   adminAccount.pubkey,
        //   new PublicKey(signers[i]),
        // );
        setSavePerc(Math.round(100 * ((i + 1) / signers.length)));
      } catch (e) {
        console.error(e);
        failedSignersHold.push(signers[i]);
        notify({
          message: signers[i] + LABELS.PUB_KEY_FAILED,
          type: 'error',
        });
      }
    }
    setFailedSigners(failedSignersHold);
    setSaving(false);
    setSavePerc(0);
    setIsModalVisible(failedSignersHold.length > 0);
    if (failedSignersHold.length === 0) form.resetFields();
  };

  return (
    <>
      {adminAccount ? (
        <Button
          onClick={() => {
            setIsModalVisible(true);
          }}
        >
          {LABELS.ADD_SIGNERS}
        </Button>
      ) : null}
      <Modal
        title={LABELS.ADD_SIGNERS}
        visible={isModalVisible}
        destroyOnClose={true}
        onOk={form.submit}
        zIndex={10000}
        onCancel={() => {
          if (!saving) setIsModalVisible(false);
        }}
      >
        <Form
          className={'signers-form'}
          {...layout}
          form={form}
          onFinish={onSubmit}
          name="control-hooks"
        >
          {!saving && (
            <>
              <Form.Item
                name="signers"
                label={LABELS.SIGNERS}
                rules={[{ required: true }]}
              >
                <TextArea
                  id="signers"
                  placeholder={LABELS.COMMA_SEPARATED_KEYS}
                />
              </Form.Item>
            </>
          )}
        </Form>
        {saving && <Progress percent={savePerc} status="active" />}

        {!saving && failedSigners.length > 0 && (
          <div
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'space-evenly',
              alignItems: 'stretch',
              display: 'flex',
            }}
          >
            <Button
              onClick={() => {
                navigator.clipboard.writeText(failedSigners.join(','));
                notify({
                  message: LABELS.FAILED_SIGNERS_COPIED_TO_CLIPBOARD,
                  type: 'success',
                });
              }}
            >
              {LABELS.COPY_FAILED_ADDRESSES_TO_CLIPBOARD}
            </Button>
            <br />
            <Button
              onClick={() => {
                form.setFieldsValue({
                  signers: failedSigners.join(','),
                });
                notify({
                  message: LABELS.FAILED_SIGNERS_COPIED_TO_INPUT,
                  type: 'success',
                });
              }}
            >
              {LABELS.COPY_FAILED_ADDRESSES_TO_INPUT}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

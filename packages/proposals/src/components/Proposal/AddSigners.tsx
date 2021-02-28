import { ParsedAccount } from '@oyster/common';
import { Button, Modal, Input, Form, Progress } from 'antd';
import React, { useState } from 'react';
import { TimelockSet } from '../../models/timelock';
import { utils, contexts, hooks } from '@oyster/common';
import { addSigner } from '../../actions/addSigner';
import { PublicKey } from '@solana/web3.js';
import { LABELS } from '../../constants';

const { notify } = utils;
const { TextArea } = Input;
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

export default function AddSigners({
  proposal,
}: {
  proposal: ParsedAccount<TimelockSet>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const adminAccount = useAccountByMint(proposal.info.adminMint);
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
    setSaving(true);
    if (!adminAccount) {
      notify({
        message: LABELS.ADMIN_ACCOUNT_NOT_DEFINED,
        type: 'error',
      });
      return;
    }
    if (signers.length == 0 || (signers.length == 1 && !signers[0])) {
      notify({
        message: LABELS.ENTER_AT_LEAST_ONE_PUB_KEY,
        type: 'error',
      });
      return;
    }

    const failedSignersHold: string[] = [];

    for (let i = 0; i < signers.length; i++) {
      try {
        await addSigner(
          connection,
          wallet.wallet,
          proposal,
          adminAccount.pubkey,
          new PublicKey(signers[i]),
        );
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

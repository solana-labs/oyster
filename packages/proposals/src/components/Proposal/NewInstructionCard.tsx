import React, { useState } from 'react';
import { Card, Progress, Spin } from 'antd';
import { Form, Input } from 'antd';
import { INSTRUCTION_LIMIT, TimelockSet } from '../../models/timelock';
import { contexts, ParsedAccount, hooks, utils } from '@oyster/common';
import { addCustomSingleSignerTransaction } from '../../actions/addCustomSingleSignerTransaction';
import { SaveOutlined } from '@ant-design/icons';
import { Connection, PublicKey } from '@solana/web3.js';
import { initializeBuffer } from '../../actions/initializeBuffer';
import { loadBufferAccount } from '../../actions/loadBufferAccount';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;
const { notify } = utils;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

enum UploadType {
  Base64 = 'Base64',
  Upgrade = 'Upgrade',
}

export function NewInstructionCard({
  proposal,
  position,
}: {
  proposal: ParsedAccount<TimelockSet>;
  position: number;
}) {
  const [form] = Form.useForm();
  const wallet = useWallet();
  const connection = useConnection();
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  const [tabKey, setTabKey] = useState<UploadType>(UploadType.Base64);
  const [inputRef, setInputRef] = useState<Input | null>(null);
  const [savePerc, setSavePerc] = useState(0);
  const [saving, setSaving] = useState(false);

  const onFinish = async (values: {
    slot: string;
    instruction: string;
    destination?: string;
  }) => {
    if (!values.slot.match(/^\d*$/)) {
      notify({
        message: 'Slot can only be numeric',
        type: 'error',
      });
      return;
    }

    let instruction = values.instruction;

    if (inputRef?.input?.files) {
      // Crap, we need to fully upload first...
      await handleUploadBpf({
        inputRef,
        connection,
        wallet,
        proposal,
        sigAccountKey: sigAccount?.pubkey,
        setSavePerc,
        setSaving,
      });
      // return for now...
      return;
    }

    if (sigAccount) {
      await addCustomSingleSignerTransaction(
        connection,
        wallet.wallet,
        proposal,
        sigAccount.pubkey,
        values.slot,
        instruction,
        position,
      );
      form.resetFields();
    }
  };

  const content = {
    [UploadType.Base64]: (
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="slot" label="Slot" rules={[{ required: true }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true }]}
        >
          <Input
            maxLength={INSTRUCTION_LIMIT}
            placeholder={
              "Base64 encoded Solana Message object with single instruction (call message.serialize().toString('base64')) no more than 255 characters"
            }
          />
        </Form.Item>
      </Form>
    ),
    [UploadType.Upgrade]: (
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="slot" label="Slot" rules={[{ required: true }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="destination"
          label="Program Address"
          rules={[{ required: true }]}
        >
          <Input
            maxLength={INSTRUCTION_LIMIT}
            placeholder={'Program Address to Update (Base 58)'}
          />
        </Form.Item>
        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true }]}
        >
          <Input type="file" ref={ref => setInputRef(ref)} />
        </Form.Item>
      </Form>
    ),
  };
  return !sigAccount ? null : (
    <Card
      title="New Instruction"
      tabList={[
        { key: UploadType.Base64, tab: 'Custom Instruction' },
        /*{ key: UploadType.Upgrade, tab: 'Program Upgrade' },*/
      ]}
      activeTabKey={tabKey}
      onTabChange={key =>
        setTabKey(key === 'Base64' ? UploadType.Base64 : UploadType.Upgrade)
      }
      actions={[<SaveOutlined key="save" onClick={form.submit} />]}
    >
      {saving && <Progress percent={savePerc} status="active" />}
      {content[tabKey]}
    </Card>
  );
}

async function handleUploadBpf({
  inputRef,
  connection,
  wallet,
  proposal,
  sigAccountKey,
  setSavePerc,
  setSaving,
}: {
  inputRef: Input;
  connection: Connection;
  wallet: any;
  proposal: ParsedAccount<TimelockSet>;
  sigAccountKey: PublicKey | undefined;
  setSavePerc: React.Dispatch<React.SetStateAction<number>>;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  if (sigAccountKey)
    return new Promise(res => {
      const reader = new FileReader();
      reader.onload = async function () {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        const len = bytes.byteLength;

        setSaving(true);
        try {
          const tempFile = await initializeBuffer(
            connection,
            wallet.wallet,
            len,
          );
          await loadBufferAccount(
            connection,
            wallet.wallet,
            tempFile,
            bytes,
            setSavePerc,
          );
        } catch (e) {
          console.error(e);
        }
        setSaving(false);
        setSavePerc(0);
        res(true);
      };
      reader.readAsArrayBuffer((inputRef?.input?.files || [])[0]);
    });
}

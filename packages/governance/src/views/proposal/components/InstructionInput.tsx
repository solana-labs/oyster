import { PlusCircleOutlined } from '@ant-design/icons';
import { ExplorerLink, ParsedAccount, utils } from '@oyster/common';
import { Token } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Modal,
  Row,
} from 'antd';
import React from 'react';
import { useState } from 'react';
import { AccountFormItem } from '../../../components/AccountFormItem/accountFormItem';
import { Governance } from '../../../models/accounts';
import { createUpgradeInstruction } from '../../../models/sdkInstructions';
import { serializeInstructionToBase64 } from '../../../models/serialisation';
import { formDefaults, formVerticalLayout } from '../../../tools/forms';

export default function InstructionInput({
  governance,
  onChange,
}: {
  governance: ParsedAccount<Governance>;
  onChange?: (v: any) => void;
}) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [form] = Form.useForm();

  const creatorsEnabled =
    governance.info.isMintGovernance() ||
    governance.info.isProgramGovernance() ||
    governance.info.isTokenGovernance();

  const updateInstruction = (instruction: string) => {
    setInstruction(instruction);
    onChange!(instruction);
  };

  const onCreateInstruction = (instruction: TransactionInstruction) => {
    updateInstruction(serializeInstructionToBase64(instruction));
    setIsFormVisible(false);
  };

  return (
    <>
      <Row>
        <Col span={22}>
          <Input.TextArea
            value={instruction}
            onChange={e => updateInstruction(e.target.value)}
            placeholder={`base64 encoded serialized Solana Instruction`}
          />
        </Col>
        {creatorsEnabled && (
          <Col span={2}>
            <Button
              type="text"
              shape="circle"
              onClick={() => setIsFormVisible(true)}
            >
              <PlusCircleOutlined />
            </Button>
          </Col>
        )}
      </Row>
      <Modal
        visible={isFormVisible}
        onOk={form.submit}
        okText="Create"
        onCancel={() => setIsFormVisible(false)}
        title={`Create ${
          governance.info.isProgramGovernance()
            ? 'Upgrade Program'
            : governance.info.isMintGovernance()
            ? 'Mint To'
            : 'Transfer'
        } Instruction`}
      >
        {governance.info.isProgramGovernance() && (
          <UpgradeProgramForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            governance={governance}
          ></UpgradeProgramForm>
        )}
        {governance.info.isMintGovernance() && (
          <MintToForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            governance={governance}
          ></MintToForm>
        )}
        {governance.info.isTokenGovernance() && (
          <TransferForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            governance={governance}
          ></TransferForm>
        )}
      </Modal>
    </>
  );
}

const UpgradeProgramForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const onCreate = async ({ bufferAddress }: { bufferAddress: string }) => {
    const upgradeIx = await createUpgradeInstruction(
      governance.info.config.governedAccount,
      new PublicKey(bufferAddress),
      governance.pubkey,
    );
    onCreateInstruction(upgradeIx);
  };

  return (
    <Form {...formVerticalLayout} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink
          address={governance.info.config.governedAccount}
          type="address"
        />
      </Form.Item>
      <Form.Item label="upgrade authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
      <Form.Item
        name="bufferAddress"
        label="buffer address"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
    </Form>
  );
};

const MintToForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const onCreate = async ({
    destination,
    amount,
  }: {
    destination: string;
    amount: number;
  }) => {
    const { token: tokenProgramId } = utils.programIds();

    const mintToIx = Token.createMintToInstruction(
      tokenProgramId,
      governance.info.config.governedAccount,
      new PublicKey(destination),
      governance.pubkey,
      [],
      amount,
    );

    onCreateInstruction(mintToIx);
  };

  return (
    <Form
      {...formVerticalLayout}
      form={form}
      onFinish={onCreate}
      initialValues={{ amount: 1 }}
    >
      <Form.Item label="mint">
        <ExplorerLink
          address={governance.info.config.governedAccount}
          type="address"
        />
      </Form.Item>
      <Form.Item label="mint authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
      <Form.Item
        name="destination"
        label="destination account"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="amount" label="amount" rules={[{ required: true }]}>
        <InputNumber min={1} />
      </Form.Item>
    </Form>
  );
};

const TransferForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const onCreate = async ({
    destination,
    amount,
  }: {
    destination: string;
    amount: number;
  }) => {
    const { token: tokenProgramId } = utils.programIds();

    const mintToIx = Token.createTransferInstruction(
      tokenProgramId,
      governance.info.config.governedAccount,
      new PublicKey(destination),
      governance.pubkey,
      [],
      amount,
    );

    onCreateInstruction(mintToIx);
  };

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ amount: 1 }}
    >
      <Form.Item label="source account">
        <ExplorerLink
          address={governance.info.config.governedAccount}
          type="address"
        />
      </Form.Item>
      <Form.Item label="account owner (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
      <AccountFormItem
        name="destination"
        label="destination account"
      ></AccountFormItem>
      <Form.Item name="amount" label="amount" rules={[{ required: true }]}>
        <InputNumber min={1} />
      </Form.Item>
    </Form>
  );
};

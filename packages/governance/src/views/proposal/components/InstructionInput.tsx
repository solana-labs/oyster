import { PlusCircleOutlined } from '@ant-design/icons';
import { ExplorerLink, ParsedAccount, useMint, utils } from '@oyster/common';
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
import { Governance } from '../../../models/accounts';
import { createUpgradeInstruction } from '../../../models/sdkInstructions';
import {
  MAX_INSTRUCTION_BASE64_LENGTH,
  serializeInstructionToBase64,
} from '../../../models/serialisation';
import { formVerticalLayout } from '../../../tools/forms';

const InstructionInput = ({
  governance,
  onChange,
}: {
  governance: ParsedAccount<Governance>;
  onChange?: (v: any) => void;
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [form] = Form.useForm();

  // We don't support MintGovernance account yet, but we can check the governed account type here
  const mint = useMint(governance.info.config.governedAccount);
  const creatorsEnabled = mint || governance.info.isProgramGovernance();

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
            maxLength={MAX_INSTRUCTION_BASE64_LENGTH}
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
          governance.info.isProgramGovernance() ? 'Upgrade Program' : 'Mint To'
        } Instruction`}
      >
        {governance.info.isProgramGovernance() && (
          <UpgradeProgramForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            governance={governance}
          ></UpgradeProgramForm>
        )}
        {mint && (
          <MintToForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            governance={governance}
          ></MintToForm>
        )}
      </Modal>
    </>
  );
};

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

export default InstructionInput;

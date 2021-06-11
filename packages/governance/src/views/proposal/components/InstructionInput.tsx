import { PlusCircleOutlined } from '@ant-design/icons';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import React from 'react';
import { useState } from 'react';
import { Governance } from '../../../models/accounts';
import { createUpgradeInstruction } from '../../../models/sdkInstructions';
import {
  MAX_INSTRUCTION_BASE64_LENGTH,
  serializeInstructionToBase64,
} from '../../../models/serialisation';
import { verticalFormLayout } from '../../../utils/forms';

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

  const updateInstruction = (instruction: string) => {
    setInstruction(instruction);
    onChange!(instruction);
  };

  const onCreate = async ({ bufferAddress }: { bufferAddress: string }) => {
    const upgradeIx = await createUpgradeInstruction(
      governance.info.config.governedAccount,
      new PublicKey(bufferAddress),
      governance.pubkey,
    );
    updateInstruction(serializeInstructionToBase64(upgradeIx));

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
        <Col span={2}>
          <Button
            type="text"
            shape="circle"
            onClick={() => setIsFormVisible(true)}
          >
            <PlusCircleOutlined />
          </Button>
        </Col>
      </Row>
      <Modal
        visible={isFormVisible}
        onOk={form.submit}
        okText="Create"
        onCancel={() => setIsFormVisible(false)}
        title="Create Upgrade Instruction"
      >
        <Form {...verticalFormLayout} form={form} onFinish={onCreate}>
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
      </Modal>
    </>
  );
};

export default InstructionInput;

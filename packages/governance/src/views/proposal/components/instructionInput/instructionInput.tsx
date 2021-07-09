import { PlusCircleOutlined } from '@ant-design/icons';
import { ParsedAccount } from '@oyster/common';

import { TransactionInstruction } from '@solana/web3.js';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import React from 'react';
import { useState } from 'react';

import { Governance } from '../../../../models/accounts';

import { serializeInstructionToBase64 } from '../../../../models/serialisation';

import { MintToForm } from './mintToForm';
import { TransferForm } from './transferForm';
import { UpgradeProgramForm } from './upgradeProgramForm';

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

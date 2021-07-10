import { PlusCircleOutlined } from '@ant-design/icons';
import { ParsedAccount } from '@oyster/common';

import { TransactionInstruction } from '@solana/web3.js';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import React from 'react';
import { useState } from 'react';

import { Governance } from '../../../../models/accounts';

import { serializeInstructionToBase64 } from '../../../../models/serialisation';
import { AccountInstructionsForm } from './accountInstructionsForm';

import { MintToForm } from './mintToForm';
import { ProgramInstructionsForm } from './programInstructionsForm';
import { TransferForm } from './transferForm';

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
        title={`Create ${
          governance.info.isProgramGovernance()
            ? 'Program'
            : governance.info.isMintGovernance()
            ? 'Mint'
            : governance.info.isTokenGovernance()
            ? 'Token'
            : 'Account'
        } Governance Instruction`}
      >
        {governance.info.isProgramGovernance() && (
          <ProgramInstructionsForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            governance={governance}
          ></ProgramInstructionsForm>
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
        {governance.info.isAccountGovernance() && (
          <AccountInstructionsForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            governance={governance}
          ></AccountInstructionsForm>
        )}
      </Modal>
    </>
  );
}

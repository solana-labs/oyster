import { PlusCircleOutlined } from '@ant-design/icons';
import { ParsedAccount } from '@oyster/common';

import { TransactionInstruction } from '@solana/web3.js';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import React, { useEffect } from 'react';
import { useState } from 'react';

import { Governance, Realm } from '../../../../models/accounts';

import { serializeInstructionToBase64 } from '../../../../models/serialisation';
import { AccountInstructionsForm } from './accountInstructionsForm';

import { ProgramInstructionsForm } from './programInstructionsForm';
import { TokenInstructionsForm } from './tokenInstructionsForm';
import { MintInstructionsForm } from './mintInstructionsForm';
import { useNativeTreasury } from '../../../../hooks/apiHooks';
import { InstructionType } from './instructionSelector';

export default function InstructionInput({
  realm,
  governance,
  onChange,
}: {
  realm: ParsedAccount<Realm>;
  governance: ParsedAccount<Governance>;
  onChange?: (v: any) => void;
}) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [form] = Form.useForm();
  const nativeTreasury = useNativeTreasury(governance.pubkey);
  const [coreInstructions, setCoreInstructions] = useState<InstructionType[]>(
    [],
  );

  useEffect(() => {
    if (nativeTreasury) {
      setCoreInstructions([InstructionType.NativeTransfer]);
    }
  }, [nativeTreasury]);

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
            realm={realm}
            governance={governance}
            coreInstructions={coreInstructions}
          ></ProgramInstructionsForm>
        )}
        {governance.info.isMintGovernance() && (
          <MintInstructionsForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            realm={realm}
            governance={governance}
            coreInstructions={coreInstructions}
          ></MintInstructionsForm>
        )}
        {governance.info.isTokenGovernance() && (
          <TokenInstructionsForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            realm={realm}
            governance={governance}
            coreInstructions={coreInstructions}
          ></TokenInstructionsForm>
        )}
        {governance.info.isAccountGovernance() && (
          <AccountInstructionsForm
            form={form}
            onCreateInstruction={onCreateInstruction}
            realm={realm}
            governance={governance}
            coreInstructions={coreInstructions}
          ></AccountInstructionsForm>
        )}
      </Modal>
    </>
  );
}

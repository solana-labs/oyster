import { PlusCircleOutlined } from '@ant-design/icons';

import { TransactionInstruction } from '@solana/web3.js';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import React, { useEffect } from 'react';
import { useState } from 'react';

import { Governance, Realm } from '@solana/spl-governance';

import { serializeInstructionToBase64 } from '@solana/spl-governance';
import { AccountInstructionsForm } from './accountInstructionsForm';

import { ProgramInstructionsForm } from './programInstructionsForm';
import { TokenInstructionsForm } from './tokenInstructionsForm';
import { MintInstructionsForm } from './mintInstructionsForm';
import { useNativeTreasury } from '../../../../hooks/apiHooks';
import { InstructionType } from './instructionSelector';
import { ProgramAccount } from '@solana/spl-governance';
import { useRpcContext } from '../../../../hooks/useRpcContext';

export default function InstructionInput({
  realm,
  governance,
  onChange,
}: {
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  onChange?: (v: any) => void;
}) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [form] = Form.useForm();
  const nativeTreasury = useNativeTreasury(governance.pubkey);
  const [coreInstructions, setCoreInstructions] = useState<InstructionType[]>(
    [],
  );
  const { programVersion } = useRpcContext();

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
          governance.account.isProgramGovernance()
            ? 'Program'
            : governance.account.isMintGovernance()
            ? 'Mint'
            : governance.account.isTokenGovernance()
            ? 'Token'
            : 'Account'
        } Governance Instruction`}
      >
        {governance.account.isProgramGovernance() && (
          <ProgramInstructionsForm
            programVersion={programVersion}
            form={form}
            onCreateInstruction={onCreateInstruction}
            realm={realm}
            governance={governance}
            coreInstructions={coreInstructions}
          ></ProgramInstructionsForm>
        )}
        {governance.account.isMintGovernance() && (
          <MintInstructionsForm
            programVersion={programVersion}
            form={form}
            onCreateInstruction={onCreateInstruction}
            realm={realm}
            governance={governance}
            coreInstructions={coreInstructions}
          ></MintInstructionsForm>
        )}
        {governance.account.isTokenGovernance() && (
          <TokenInstructionsForm
            programVersion={programVersion}
            form={form}
            onCreateInstruction={onCreateInstruction}
            realm={realm}
            governance={governance}
            coreInstructions={coreInstructions}
          ></TokenInstructionsForm>
        )}
        {governance.account.isAccountGovernance() && (
          <AccountInstructionsForm
            programVersion={programVersion}
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

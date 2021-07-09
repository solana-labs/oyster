import { Form, FormInstance, Radio } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';
import { ProgramUpgradeForm } from './programUpgradeForm';
import { AnchorIdlSetBufferForm } from './anchorIdlSetBufferForm';

enum InstructionType {
  UpgradeProgram,
  AnchorIDLSetBuffer,
}

const instructionNames = ['program upgrade', 'anchor idl set-buffer'];

export const ProgramInstructionForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const [instruction, setInstruction] = useState(
    InstructionType.UpgradeProgram,
  );

  const instructions = [
    InstructionType.UpgradeProgram,
    InstructionType.AnchorIDLSetBuffer,
  ];

  return (
    <Form
      {...formDefaults}
      initialValues={{ instructionType: instructions[0] }}
    >
      <Form.Item name="instructionType">
        <Radio.Group onChange={e => setInstruction(e.target.value)}>
          {instructions.map(i => (
            <Radio.Button value={i} key={i}>
              {instructionNames[i]}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>
      {instruction === InstructionType.UpgradeProgram && (
        <ProgramUpgradeForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></ProgramUpgradeForm>
      )}
      {instruction === InstructionType.AnchorIDLSetBuffer && (
        <AnchorIdlSetBufferForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></AnchorIdlSetBufferForm>
      )}
    </Form>
  );
};

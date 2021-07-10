import { Form, FormInstance, Radio } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';
import { ProgramUpgradeForm } from './programUpgradeForm';
import { AnchorIdlSetBufferForm } from './anchorIdlSetBufferForm';
import { useAnchorIdlAccount } from '../../../../tools/anchor/anchorHooks';
import { GovernanceConfigForm } from './governanceConfigForm';

enum InstructionType {
  UpgradeProgram,
  AnchorIDLSetBuffer,
  GovernanceSetConfig,
}

const instructionNames = [
  'program upgrade',
  'anchor idl set-buffer',
  'governance set-config',
];

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

  const anchorIdlAccount = useAnchorIdlAccount(governance.info.governedAccount);

  let anchorInstructions = anchorIdlAccount
    ? [InstructionType.AnchorIDLSetBuffer]
    : [];

  let instructions = [
    InstructionType.UpgradeProgram,
    ...anchorInstructions,
    InstructionType.GovernanceSetConfig,
  ];

  return (
    <Form
      {...formDefaults}
      initialValues={{ instructionType: instructions[0] }}
    >
      <Form.Item name="instructionType" label="instruction">
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
      {instruction === InstructionType.GovernanceSetConfig && (
        <GovernanceConfigForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></GovernanceConfigForm>
      )}
    </Form>
  );
};

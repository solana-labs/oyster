import { Form, FormInstance } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';

import { GovernanceConfigForm } from './governanceConfigForm';

import { InstructionSelector, InstructionType } from './instructionSelector';

export const AccountInstructionsForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const [instruction, setInstruction] = useState(
    InstructionType.GovernanceSetConfig,
  );

  let instructions = [InstructionType.GovernanceSetConfig];

  return (
    <Form
      {...formDefaults}
      initialValues={{ instructionType: instructions[0] }}
    >
      <InstructionSelector
        instructions={[InstructionType.GovernanceSetConfig]}
        onChange={setInstruction}
      ></InstructionSelector>

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

import { Form, FormInstance } from 'antd';

import { Governance, Realm } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';

import { InstructionSelector, InstructionType } from './instructionSelector';
import {
  getGovernanceInstructions,
  GovernanceInstructionForm,
} from './governanceInstructionForm';
import { ProgramAccount } from '../../../../models/tools/solanaSdk';

export const AccountInstructionsForm = ({
  form,
  realm,
  governance,
  onCreateInstruction,
  coreInstructions,
}: {
  form: FormInstance;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
  coreInstructions: InstructionType[];
}) => {
  const [instruction, setInstruction] = useState<InstructionType | undefined>();

  let instructions = [
    ...coreInstructions,
    ...getGovernanceInstructions(realm, governance),
  ];

  if (!instruction) {
    setInstruction(instructions[0]);
    return null;
  }

  return (
    <Form
      {...formDefaults}
      initialValues={{ instructionType: instructions[0] }}
    >
      <InstructionSelector
        instructions={instructions}
        onChange={setInstruction}
      ></InstructionSelector>

      <GovernanceInstructionForm
        form={form}
        realm={realm}
        governance={governance}
        onCreateInstruction={onCreateInstruction}
        instruction={instruction}
      ></GovernanceInstructionForm>
    </Form>
  );
};

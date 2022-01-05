import { Form, FormInstance } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance, Realm } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';

import { InstructionSelector, InstructionType } from './instructionSelector';
import {
  getGovernanceInstructions,
  GovernanceInstructionForm,
} from './governanceInstructionForm';

export const AccountInstructionsForm = ({
  form,
  realm,
  governance,
  onCreateInstruction,
  coreInstructions,
}: {
  form: FormInstance;
  realm: ParsedAccount<Realm>;
  governance: ParsedAccount<Governance>;
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

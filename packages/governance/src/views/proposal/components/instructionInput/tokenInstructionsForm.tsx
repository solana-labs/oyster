import { Form, FormInstance } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance, Realm } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';

import { InstructionSelector, InstructionType } from './instructionSelector';
import { SplTokenTransferForm } from './splTokenTransferForm';
import {
  getGovernanceInstructions,
  GovernanceInstructionForm,
} from './governanceInstructionForm';

export const TokenInstructionsForm = ({
  form,
  realm,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  realm: ParsedAccount<Realm>;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const [instruction, setInstruction] = useState(
    InstructionType.SplTokenTransfer,
  );

  let instructions = [
    InstructionType.SplTokenTransfer,
    ...getGovernanceInstructions(realm, governance),
  ];

  return (
    <Form {...formDefaults} initialValues={{ instructionType: instruction }}>
      <InstructionSelector
        instructions={instructions}
        onChange={setInstruction}
      ></InstructionSelector>
      {instruction === InstructionType.SplTokenTransfer && (
        <SplTokenTransferForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></SplTokenTransferForm>
      )}

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

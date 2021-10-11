import { Form, FormInstance } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance, Realm } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';

import { InstructionSelector, InstructionType } from './instructionSelector';
import { SplTokenMintToForm } from './splTokenMintToForm';
import {
  getGovernanceInstructions,
  GovernanceInstructionForm,
} from './governanceInstructionForm';

export const MintInstructionsForm = ({
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
    InstructionType.SplTokenMintTo,
  );

  let instructions = [
    InstructionType.SplTokenMintTo,
    ...getGovernanceInstructions(realm, governance),
  ];

  return (
    <Form {...formDefaults} initialValues={{ instructionType: instruction }}>
      <InstructionSelector
        instructions={instructions}
        onChange={setInstruction}
      ></InstructionSelector>
      {instruction === InstructionType.SplTokenMintTo && (
        <SplTokenMintToForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></SplTokenMintToForm>
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

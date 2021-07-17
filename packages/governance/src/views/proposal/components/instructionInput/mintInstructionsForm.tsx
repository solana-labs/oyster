import { Form, FormInstance } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';

import { GovernanceConfigForm } from './governanceConfigForm';

import { InstructionSelector, InstructionType } from './instructionSelector';
import { SplTokenMintToForm } from './splTokenMintToForm';

export const MintInstructionsForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const [instruction, setInstruction] = useState(
    InstructionType.SplTokenMintTo,
  );

  let instructions = [
    InstructionType.SplTokenMintTo,
    InstructionType.GovernanceSetConfig,
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

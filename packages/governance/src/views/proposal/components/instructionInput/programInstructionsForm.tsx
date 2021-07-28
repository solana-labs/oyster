import { Form, FormInstance } from 'antd';
import { ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useState } from 'react';

import { formDefaults } from '../../../../tools/forms';
import { ProgramUpgradeForm } from './programUpgradeForm';
import { AnchorIdlSetBufferForm } from './anchorIdlSetBufferForm';
import { useAnchorIdlAccount } from '../../../../tools/anchor/anchorHooks';
import { GovernanceConfigForm } from './governanceConfigForm';

import { InstructionSelector, InstructionType } from './instructionSelector';

export const ProgramInstructionsForm = ({
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

  // TODO: filter available instructions based on the already included into a Proposal
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
      <InstructionSelector
        instructions={instructions}
        onChange={setInstruction}
      ></InstructionSelector>
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

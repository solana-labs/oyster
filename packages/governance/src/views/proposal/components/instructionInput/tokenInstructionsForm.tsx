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
import { RaydiumAddLiquidityForm } from './raydiumAddLiquidityForm';
import { RaydiumStakeForm } from './raydiumStakeForm';

function isYieldFarmingGovernance(governance: ParsedAccount<Governance>) {
  // TODO: add governance metadata to capture available instruction types
  const yfGovernances = [
    'EVhURne36yBfuTfqwn1W2hWdi6i3Vhau9n4FE8ehHbKM', // SCTF1 Realm
    'BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ', // Yield Farming Realm
  ];

  return yfGovernances.includes(governance.pubkey.toBase58());
}

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
  const [instruction, setInstruction] = useState<InstructionType | undefined>();

  const yfInstructions = isYieldFarmingGovernance(governance)
    ? [InstructionType.RaydiumAddLiquidity, InstructionType.RaydiumStake]
    : [];

  let instructions = [
    ...yfInstructions,
    InstructionType.SplTokenTransfer,
    ...getGovernanceInstructions(realm, governance),
  ];

  if (!instruction) {
    setInstruction(instructions[0]);
    return null;
  }

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

      {instruction === InstructionType.RaydiumAddLiquidity && (
        <RaydiumAddLiquidityForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></RaydiumAddLiquidityForm>
      )}

      {instruction === InstructionType.RaydiumStake && (
        <RaydiumStakeForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></RaydiumStakeForm>
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

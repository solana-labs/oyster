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
import { RaydiumStakeLPForm } from './raydiumStakeLPForm';
import { isYieldFarmingGovernance } from './yieldFarming';

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

  const yfInstructions = isYieldFarmingGovernance(governance.pubkey)
    ? [
        InstructionType.RaydiumAddLiquidity,
        InstructionType.RaydiumStakeLP,
        InstructionType.RaydiumHarvestLP,
      ]
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

      {instruction === InstructionType.RaydiumStakeLP && (
        <RaydiumStakeLPForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
          isHarvest={false}
        ></RaydiumStakeLPForm>
      )}
      {instruction === InstructionType.RaydiumHarvestLP && (
        <RaydiumStakeLPForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
          isHarvest={true}
        ></RaydiumStakeLPForm>
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

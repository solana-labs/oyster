import { Form, FormInstance } from 'antd';

import { Governance, Realm } from '@solana/spl-governance';
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
import { RaydiumStakeRAYForm } from './raydiumStakeRAYForm';
import { ProgramAccount } from '@solana/spl-governance';

export const TokenInstructionsForm = ({
  programVersion,
  form,
  realm,
  governance,
  onCreateInstruction,
  coreInstructions,
}: {
  programVersion: number;
  form: FormInstance;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
  coreInstructions: InstructionType[];
}) => {
  const [instruction, setInstruction] = useState<InstructionType | undefined>();

  const yfInstructions = isYieldFarmingGovernance(governance.pubkey)
    ? [
        InstructionType.RaydiumAddLiquidity,
        InstructionType.RaydiumStakeLP,
        InstructionType.RaydiumHarvestLP,
        InstructionType.RaydiumStakeRAY,
        InstructionType.RaydiumHarvestRAY,
      ]
    : [];

  let instructions = [
    ...yfInstructions,
    InstructionType.SplTokenTransfer,
    ...coreInstructions,
    ...getGovernanceInstructions(programVersion, realm, governance),
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

      {instruction === InstructionType.RaydiumStakeRAY && (
        <RaydiumStakeRAYForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
          isHarvest={false}
        ></RaydiumStakeRAYForm>
      )}
      {instruction === InstructionType.RaydiumHarvestRAY && (
        <RaydiumStakeRAYForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
          isHarvest={true}
        ></RaydiumStakeRAYForm>
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

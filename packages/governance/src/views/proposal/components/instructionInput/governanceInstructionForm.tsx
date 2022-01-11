import { FormInstance } from 'antd';
import React from 'react';

import { Governance, Realm } from '@solana/spl-governance';
import { GovernanceConfigForm } from './governanceConfigForm';
import { InstructionType } from './instructionSelector';
import { TransactionInstruction } from '@solana/web3.js';
import { RealmConfigForm } from './realmConfigForm';
import { NativeTransferForm } from './nativeTokenTransferForm';
import { ProgramAccount } from '@solana/spl-governance';

export function getGovernanceInstructions(
  realm: ProgramAccount<Realm>,
  governance: ProgramAccount<Governance>,
) {
  let instructions = [InstructionType.GovernanceSetConfig];

  if (governance.pubkey.toBase58() === realm.account.authority?.toBase58()) {
    instructions.push(InstructionType.GovernanceSetRealmConfig);
  }

  return instructions;
}

export function GovernanceInstructionForm({
  form,
  instruction,
  realm,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  instruction: InstructionType;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) {
  return (
    <>
      {instruction === InstructionType.NativeTransfer && (
        <NativeTransferForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></NativeTransferForm>
      )}

      {instruction === InstructionType.GovernanceSetConfig && (
        <GovernanceConfigForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></GovernanceConfigForm>
      )}
      {instruction === InstructionType.GovernanceSetRealmConfig && (
        <RealmConfigForm
          form={form}
          realm={realm}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></RealmConfigForm>
      )}
    </>
  );
}

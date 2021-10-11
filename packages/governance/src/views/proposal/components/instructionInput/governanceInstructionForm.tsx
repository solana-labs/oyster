import { FormInstance } from 'antd';
import React from 'react';
import { ParsedAccount } from '@oyster/common';
import { Governance, Realm } from '../../../../models/accounts';
import { GovernanceConfigForm } from './governanceConfigForm';
import { InstructionType } from './instructionSelector';
import { TransactionInstruction } from '@solana/web3.js';
import { RealmConfigForm } from './realmConfigForm';

export function getGovernanceInstructions(
  realm: ParsedAccount<Realm>,
  governance: ParsedAccount<Governance>,
) {
  let instructions = [InstructionType.GovernanceSetConfig];

  if (governance.pubkey.toBase58() === realm.info.authority?.toBase58()) {
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
  realm: ParsedAccount<Realm>;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) {
  return (
    <>
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

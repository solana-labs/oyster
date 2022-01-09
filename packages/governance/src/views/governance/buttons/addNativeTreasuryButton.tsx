import React, { useState } from 'react';
import { Governance, Realm } from '@solana/governance-sdk';

import { useRpcContext } from '../../../hooks/useRpcContext';
import { createNativeTreasury } from '../../../actions/createNativeTreasury';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import { useNativeTreasury } from '../../../hooks/apiHooks';
import { PROGRAM_VERSION_V1 } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

export function CreateNativeTreasuryButton({
  realm,
  governance,
}: {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance> | undefined;
}) {
  const rpcContext = useRpcContext();
  const nativeTreasury = useNativeTreasury(governance?.pubkey);
  const [created, setCreated] = useState(false);

  const onSubmit = async () => {
    await createNativeTreasury(rpcContext, governance!);
    setCreated(true);
  };

  if (!(realm || governance)) {
    return null;
  }

  return (
    <ModalFormAction<void>
      label="Create SOL Treasury"
      formTitle="Create SOL Treasury"
      formAction="Create"
      formPendingAction="Creating"
      onSubmit={() => onSubmit()}
      buttonProps={{
        disabled:
          !!nativeTreasury ||
          created ||
          rpcContext.programVersion <= PROGRAM_VERSION_V1,
      }}
    >
      <div>Create native SOL Treasury account for the governance</div>
    </ModalFormAction>
  );
}

import React from 'react';
import { Realm } from '@solana/spl-governance';

import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import { ProgramAccount } from '@solana/spl-governance';
import { useVoterStakeRegistryClient } from '../../../hooks/useVoterStakeRegistryClient';

import BN from 'bn.js';
import { configureVoterStakeRegistry } from '../../../actions/voterStakeRegistry/configureVoterStakeRegistry';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { getSecondsFromYears } from '../../../tools/units';

export function ConfigureVoterStakeRegistryButton({
  realm,
}: {
  realm: ProgramAccount<Realm>;
}) {
  const vsrClient = useVoterStakeRegistryClient();
  const rpcContext = useRpcContext();

  const digitShift = 0;
  const depositScaledFactor = new BN(1);
  const lockupScaledFactor = new BN(1);
  const lockupSaturationSecs = new BN(getSecondsFromYears(5));

  const onSubmit = async () => {
    await configureVoterStakeRegistry(
      rpcContext,
      vsrClient!,
      realm,
      digitShift,
      depositScaledFactor,
      lockupScaledFactor,
      lockupSaturationSecs,
    );

    return null;
  };

  return (
    <ModalFormAction<null>
      label="Configure Vote Registry"
      formTitle="Configure Vote Registry"
      formAction="Set Configure Vote Registry"
      formPendingAction="Setting Configure Vote Registry"
      onSubmit={onSubmit}
      initialValues={{ useCouncilMint: false }}
    ></ModalFormAction>
  );
}

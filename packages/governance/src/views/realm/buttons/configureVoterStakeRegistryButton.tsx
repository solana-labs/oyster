import React from 'react';
import { Realm } from '@solana/spl-governance';

import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import { ProgramAccount } from '@solana/spl-governance';
import { useVoterStakeRegistryClient } from '../../../hooks/useVoterStakeRegistryClient';

import BN from 'bn.js';
import { configureVoterStakeRegistry } from '../../../actions/voterStakeRegistry/configureVoterStakeRegistry';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { getSecondsFromYears } from '../../../tools/units';
import {
  VotingMintConfigFormItem,
  VotingMintConfigValues,
} from '../../../components/voterStakeRegistry/votingMintConfigFormItem';
import { getScaledFactor } from '../../../tools/voterStakeRegistry/voterStakeRegistry';

export function ConfigureVoterStakeRegistryButton({
  realm,
}: {
  realm: ProgramAccount<Realm>;
}) {
  const vsrClient = useVoterStakeRegistryClient();
  const rpcContext = useRpcContext();

  const onSubmit = async (values: VotingMintConfigValues) => {
    const dd = getScaledFactor(values.depositFactor);

    console.log('VALUES:', values, dd);

    await configureVoterStakeRegistry(
      rpcContext,
      vsrClient!,
      realm,
      values.digitShift,
      getScaledFactor(values.depositFactor),
      getScaledFactor(values.lockupFactor),
      new BN(getSecondsFromYears(values.lockupSaturationYears).toString()),
    );

    return null;
  };

  return (
    <ModalFormAction<null>
      label="Configure Voter Stake Registry"
      formTitle="Configure Voter Stake Registry"
      formAction="Configure"
      formPendingAction="Configuring"
      onSubmit={onSubmit}
    >
      <VotingMintConfigFormItem realm={realm}></VotingMintConfigFormItem>
    </ModalFormAction>
  );
}

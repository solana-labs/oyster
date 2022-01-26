import React from 'react';
import { Realm } from '@solana/spl-governance';

import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import { ProgramAccount } from '@solana/spl-governance';
import { useVoterStakeRegistryClient } from '../../../hooks/useVoterStakeRegistryClient';

import { configureVoterStakeRegistry } from '../../../actions/voterStakeRegistry/configureVoterStakeRegistry';
import { useRpcContext } from '../../../hooks/useRpcContext';

import {
  getVotingMintConfigApiValues,
  VotingMintConfigFormItem,
  VotingMintConfigValues,
} from '../../../components/voterStakeRegistry/votingMintConfigFormItem';

export function ConfigureVoterStakeRegistryButton({
  realm,
}: {
  realm: ProgramAccount<Realm>;
}) {
  const vsrClient = useVoterStakeRegistryClient();
  const rpcContext = useRpcContext();

  const onSubmit = async (values: VotingMintConfigValues) => {
    const {
      digitShift,
      unlockedScaledFactor,
      lockupScaledFactor,
      lockupSaturationSecs,
    } = getVotingMintConfigApiValues(values);

    await configureVoterStakeRegistry(
      rpcContext,
      vsrClient!,
      realm,
      digitShift,
      unlockedScaledFactor,
      lockupScaledFactor,
      lockupSaturationSecs,
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

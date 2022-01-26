import { Form, FormInstance } from 'antd';
import { ExplorerLink, useWallet } from '@oyster/common';
import { Governance, Realm } from '@solana/spl-governance';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { ProgramAccount } from '@solana/spl-governance';

import { useRpcContext } from '../../../../../hooks/useRpcContext';
import { formDefaults } from '../../../../../tools/forms';
import { useVoterStakeRegistryClient } from '../../../../../hooks/useVoterStakeRegistryClient';
import { getRegistrarAddress } from '../../../../../tools/voterStakeRegistry/accounts';
import {
  getVotingMintConfigApiValues,
  VotingMintConfigFormItem,
  VotingMintConfigValues,
} from '../../../../../components/voterStakeRegistry/votingMintConfigFormItem';

export const VoterStakeConfigureMintForm = ({
  form,
  realm,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  realm: ProgramAccount<Realm>;
  governance: ProgramAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const { programId } = useRpcContext();
  const wallet = useWallet();
  const vsrClient = useVoterStakeRegistryClient();

  if (!wallet?.publicKey) {
    return <div>Wallet not connected</div>;
  }

  const onCreate = async (values: VotingMintConfigValues) => {
    const {
      digitShift,
      unlockedScaledFactor,
      lockupScaledFactor,
      lockupSaturationSecs,
    } = getVotingMintConfigApiValues(values);

    const { registrarPda } = await getRegistrarAddress(
      vsrClient?.program.programId!,
      realm.pubkey,
      realm.account.communityMint,
    );

    const configureVotingMintIx =
      vsrClient?.program.instruction.configureVotingMint(
        0, // mint index
        digitShift, // digit_shift
        unlockedScaledFactor, // unlocked_scaled_factor
        lockupScaledFactor, // lockup_scaled_factor
        lockupSaturationSecs, // lockup_saturation_secs
        realm.account.authority!,
        {
          accounts: {
            registrar: registrarPda,
            realmAuthority: realm.account.authority!,
            mint: realm.account.communityMint!,
          },
          remainingAccounts: [
            {
              pubkey: realm.account.communityMint!,
              isSigner: false,
              isWritable: false,
            },
          ],
        },
      )!;

    onCreateInstruction(configureVotingMintIx);
  };

  return (
    <Form {...formDefaults} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink address={programId} type="address" />
      </Form.Item>
      <Form.Item label="realm">
        <ExplorerLink address={realm.pubkey} type="address" />
      </Form.Item>
      <VotingMintConfigFormItem realm={realm}></VotingMintConfigFormItem>
    </Form>
  );
};

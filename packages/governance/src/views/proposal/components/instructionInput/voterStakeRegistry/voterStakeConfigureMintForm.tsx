import { Form, FormInstance } from 'antd';
import { ExplorerLink, useWallet } from '@oyster/common';
import { Governance, Realm } from '@solana/spl-governance';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { ProgramAccount } from '@solana/spl-governance';

import { useRpcContext } from '../../../../../hooks/useRpcContext';
import { formDefaults } from '../../../../../tools/forms';
import { useVoterStakeRegistryClient } from '../../../../../hooks/useVoterStakeRegistryClient';
import { getRegistrarAddress, Registrar, unusedMintPk } from '../../../../../tools/voterStakeRegistry/accounts';
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
      mint,
      mintIndex,
      grantAuthority
    } = getVotingMintConfigApiValues(values);

    const { registrarPda } = await getRegistrarAddress(
      vsrClient?.program.programId!,
      realm.pubkey,
      realm.account.communityMint,
    );

    let remainingAccounts = [{
      pubkey: mint,
      isSigner: false,
      isWritable: false,
    }];

    try {
      // If we can fetch the registrar then use it for the additional mint configs
      // Note: The registrar might not exist if we are setting this for the first time in a single proposal
      // In that case we default to 0 existing mints
      const registrar = await vsrClient?.program.account.registrar.fetch(registrarPda) as Registrar;

      const registrarMints = registrar?.votingMints.filter(vm => !vm.mint.equals(unusedMintPk)).map(vm => {
        return {
          pubkey: vm.mint,
          isSigner: false,
          isWritable: false,
        }
      });


      remainingAccounts = remainingAccounts.concat(registrarMints)
    }
    catch (ex) {
      console.info("Can't fetch registrar", ex)
    }

    if (mintIndex > remainingAccounts.length) {
      throw new Error(`Invalid mint index. Mint index: ${mintIndex}. Remaining accounts: ${remainingAccounts}`)
    }

    console.log("REMAINING", { remainingAccounts, mintIndex })

    const configureVotingMintIx =
      vsrClient?.program.instruction.configureVotingMint(
        mintIndex, // mint index
        digitShift, // digit_shift
        unlockedScaledFactor, // unlocked_scaled_factor
        lockupScaledFactor, // lockup_scaled_factor
        lockupSaturationSecs, // lockup_saturation_secs
        grantAuthority, // grant_authority
        {
          accounts: {
            registrar: registrarPda,
            realmAuthority: realm.account.authority!,
            mint: mint,
          },
          remainingAccounts: remainingAccounts,
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
      <VotingMintConfigFormItem realm={realm} governance={governance}></VotingMintConfigFormItem>
    </Form>
  );
};

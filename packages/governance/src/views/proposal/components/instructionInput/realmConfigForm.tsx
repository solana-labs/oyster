import { Form, FormInstance, InputNumber } from 'antd';
import {
  ExplorerLink,
  ParsedAccount,
  useMint,
  useWallet,
} from '@oyster/common';
import { Governance, Realm } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { formDefaults } from '../../../../tools/forms';
import { useAnchorIdlAddress } from '../../../../tools/anchor/anchorHooks';

import { useRpcContext } from '../../../../hooks/useRpcContext';
import { createSetRealmConfig } from '../../../../models/createSetRealmConfig';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import {
  parseMintSupplyFraction,
  RealmMintSupplyConfigFormItem,
  RealmMintSupplyConfigValues,
} from '../../../../components/realmMintSupplyConfigFormItem/realmMintSupplyConfigFormItem';
import BN from 'bn.js';
import {
  getMintDecimalAmountFromNatural,
  getMintMinAmountAsDecimal,
  getMintSupplyAsDecimal,
} from '../../../../tools/units';

export interface RealmConfigValues {
  minCommunityTokensToCreateGovernance: number | string;
}

class RealmConfigFormModel {
  minCommunityTokensToCreateGovernance: BN;

  constructor(args: { minCommunityTokensToCreateGovernance: BN }) {
    this.minCommunityTokensToCreateGovernance =
      args.minCommunityTokensToCreateGovernance;
  }
}

export function getRealmConfig(values: RealmConfigValues) {
  return new RealmConfigFormModel({
    minCommunityTokensToCreateGovernance: new BN(
      values.minCommunityTokensToCreateGovernance,
    ),
  });
}

export const RealmConfigForm = ({
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
  const idlAddress = useAnchorIdlAddress(governance.info.governedAccount);
  const { programId, programVersion } = useRpcContext();
  const wallet = useWallet();
  const communityMintInfo = useMint(realm?.info.communityMint);

  if (!wallet?.publicKey) {
    return <div>Wallet not connected</div>;
  }

  const onCreate = async (
    values: {
      removeCouncil: boolean;
    } & RealmMintSupplyConfigValues &
      RealmConfigValues,
  ) => {
    // keep the original value until for mis updated
    const setRealmConfigIx = await createSetRealmConfig(
      programId,
      programVersion,
      realm.pubkey,
      governance.pubkey,
      values.removeCouncil === true ? undefined : realm.info.config.councilMint,
      parseMintSupplyFraction(values.communityMintMaxVoteWeightFraction),
      new BN(values.minCommunityTokensToCreateGovernance),
      undefined,
      // TODO: Once current wallet placeholder is supported to execute instruction using the wallet which executes the instruction replace it with the placeholder
      wallet.publicKey!,
    );

    onCreateInstruction(setRealmConfigIx);
  };

  let minTokenAmount = communityMintInfo
    ? getMintMinAmountAsDecimal(communityMintInfo)
    : 0;
  let minTokensToCreateProposal = minTokenAmount;
  minTokensToCreateProposal = communityMintInfo
    ? getMintDecimalAmountFromNatural(
        communityMintInfo,
        realm.info.config.minCommunityTokensToCreateGovernance,
      ).toNumber()
    : 0;

  let maxTokenAmount =
    communityMintInfo && !communityMintInfo.supply.isZero()
      ? getMintSupplyAsDecimal(communityMintInfo)
      : 0;
  let mintDecimals = communityMintInfo ? communityMintInfo.decimals : 0;

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ idlAccount: idlAddress }}
    >
      <Form.Item label="program id">
        <ExplorerLink address={programId} type="address" />
      </Form.Item>
      <Form.Item label="realm">
        <ExplorerLink address={realm.pubkey} type="address" />
      </Form.Item>
      <Form.Item label="realm authority (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
      {realm.info.config.councilMint && (
        <Form.Item
          label="remove council"
          name="removeCouncil"
          valuePropName="checked"
        >
          <Checkbox></Checkbox>
        </Form.Item>
      )}
      <RealmMintSupplyConfigFormItem
        communityMintAddress={realm.info.communityMint}
        maxVoteWeightSource={realm.info.config.communityMintMaxVoteWeightSource}
      ></RealmMintSupplyConfigFormItem>
      {communityMintInfo && (
        <Form.Item
          label={'Min tokens to create governance'}
          name="minTokensToCreateGovernance"
          rules={[{ required: true }]}
          initialValue={minTokensToCreateProposal}
          noStyle
        >
          <InputNumber
            min={minTokenAmount}
            max={maxTokenAmount}
            step={minTokenAmount}
            style={{ width: 200 }}
            stringMode={mintDecimals !== 0}
          />
        </Form.Item>
      )}
    </Form>
  );
};

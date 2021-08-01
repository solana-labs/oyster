import { Form, FormInstance } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
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
  const { programId } = useRpcContext();

  const onCreate = async (
    values: {
      removeCouncil: boolean;
    } & RealmMintSupplyConfigValues,
  ) => {
    const setRealmConfigIx = await createSetRealmConfig(
      programId,
      realm.pubkey,
      governance.pubkey,
      realm.info.config.custodian,
      values.removeCouncil === true ? undefined : realm.info.config.councilMint,
      parseMintSupplyFraction(values.communityMintMaxVoteWeightFraction),
    );

    onCreateInstruction(setRealmConfigIx);
  };

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
    </Form>
  );
};

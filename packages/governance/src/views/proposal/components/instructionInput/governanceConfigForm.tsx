import { Form, FormInstance } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { formDefaults } from '../../../../tools/forms';
import { useAnchorIdlAddress } from '../../../../tools/anchor/anchorHooks';

import {
  getGovernanceConfig,
  GovernanceConfigFormItem,
  GovernanceConfigValues,
} from '../../../../components/governanceConfigFormItem/governanceConfigFormItem';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { createSetGovernanceConfig } from '../../../../models/createSetGovernanceConfig';

export const GovernanceConfigForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const idlAddress = useAnchorIdlAddress(governance.info.governedAccount);
  const { programId } = useRpcContext();

  const onCreate = async (values: GovernanceConfigValues) => {
    const config = getGovernanceConfig(values);

    const setGovernanceConfigIx = createSetGovernanceConfig(
      programId,
      governance.pubkey,
      config,
    );

    onCreateInstruction(setGovernanceConfigIx);
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
      <Form.Item label="governance account">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>

      <GovernanceConfigFormItem
        governanceConfig={governance.info.config}
      ></GovernanceConfigFormItem>
    </Form>
  );
};

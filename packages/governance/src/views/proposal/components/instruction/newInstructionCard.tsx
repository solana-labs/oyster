import React, { useState } from 'react';
import { Card, InputNumber } from 'antd';
import { Form } from 'antd';

import { SaveOutlined } from '@ant-design/icons';
import { LABELS } from '../../../../constants';
import {
  Governance,
  InstructionData,
  Proposal,
  Realm,
} from '@solana/spl-governance';

import { useProposalAuthority } from '../../../../hooks/apiHooks';
import { insertInstruction } from '../../../../actions/insertInstruction';
import '../style.less';

import { formDefaults } from '../../../../tools/forms';
import InstructionInput from '../instructionInput/instructionInput';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { DryRunInstructionButton } from './buttons/dryRunInstructionButton';
import { getInstructionDataFromBase64 } from '@solana/spl-governance';
import {
  getDaysFromTimestamp,
  getTimestampFromDays,
} from '../../../../tools/units';
import { useAccountChangeTracker } from '../../../../contexts/GovernanceContext';
import { ProgramAccount } from '@solana/spl-governance';

export function NewInstructionCard({
  realm,
  proposal,
  governance,
}: {
  realm: ProgramAccount<Realm>;
  proposal: ProgramAccount<Proposal>;
  governance: ProgramAccount<Governance>;
}) {
  const [form] = Form.useForm();
  const rpcContext = useRpcContext();
  const [instructionData, setInstructionData] = useState<InstructionData>();
  const changeTracker = useAccountChangeTracker();

  const proposalAuthority = useProposalAuthority(
    proposal.account.tokenOwnerRecord,
  );

  const onFinish = async (values: {
    slot: string;
    instruction: string;
    holdUpTime: number;
  }) => {
    let optionIndex = 0; // default to first option

    // If instructionsNextIndex exists then we have V1 account and otherwise V2
    let index =
      proposal.account.instructionsNextIndex ??
      proposal.account.options[optionIndex].instructionsNextIndex;

    try {
      const instructionData = getInstructionDataFromBase64(values.instruction);

      const proposalInstructionAddress = await insertInstruction(
        rpcContext,
        proposal,
        proposalAuthority!.pubkey,
        index,
        optionIndex,
        getTimestampFromDays(values.holdUpTime),
        instructionData,
      );

      form.resetFields();
      setInstructionData(undefined);

      // Updates are not reliable and we have to fetch the new instruction and publish its update
      changeTracker.fetchAndNotifyAccountUpdated(
        rpcContext.connection,
        proposalInstructionAddress,
      );
    } catch (ex) {
      console.log('ERROR', ex);
    }
  };

  const minHoldUpTime = getDaysFromTimestamp(
    governance.account.config.minInstructionHoldUpTime,
  );

  const onInstructionChange = (instructionDataBase64: string) => {
    try {
      const instructionData: InstructionData = getInstructionDataFromBase64(
        instructionDataBase64,
      );

      setInstructionData(instructionData);
    } catch {
      setInstructionData(undefined);
    }
  };

  const instructionValidator = async (rule: any, value: string) => {
    if (rule.required && !value) {
      throw new Error(`Please provide instruction`);
    } else {
      try {
        getInstructionDataFromBase64(value);
      } catch {
        throw new Error(`Invalid instruction data`);
      }
    }
  };

  return !proposalAuthority ? null : (
    <Card
      title="New Instruction"
      actions={[<SaveOutlined key="save" onClick={form.submit} />]}
      extra={[
        <DryRunInstructionButton
          proposal={proposal}
          instructionData={instructionData}
        ></DryRunInstructionButton>,
      ]}
    >
      <Form
        {...formDefaults}
        form={form}
        name="control-hooks"
        onFinish={onFinish}
        initialValues={{
          holdUpTime: minHoldUpTime,
        }}
      >
        <Form.Item
          name="holdUpTime"
          label={LABELS.HOLD_UP_TIME_DAYS}
          rules={[{ required: true }]}
        >
          <InputNumber min={minHoldUpTime} />
        </Form.Item>

        <Form.Item
          name="instruction"
          label="instruction"
          rules={[{ required: true, validator: instructionValidator }]}
        >
          <InstructionInput
            realm={realm}
            governance={governance}
            onChange={onInstructionChange}
          ></InstructionInput>
        </Form.Item>
      </Form>
    </Card>
  );
}

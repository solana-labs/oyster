import React from 'react';
import { Card, InputNumber } from 'antd';
import { Form } from 'antd';

import { ParsedAccount } from '@oyster/common';

import { SaveOutlined } from '@ant-design/icons';
import { LABELS } from '../../../../constants';
import { Governance, Proposal } from '../../../../models/accounts';

import { useProposalAuthority } from '../../../../hooks/apiHooks';
import { insertInstruction } from '../../../../actions/insertInstruction';
import '../style.less';

import { formDefaults } from '../../../../tools/forms';
import InstructionInput from '../instructionInput/instructionInput';
import { useRpcContext } from '../../../../hooks/useRpcContext';

export function NewInstructionCard({
  proposal,
  governance,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
}) {
  const [form] = Form.useForm();
  const rpcContext = useRpcContext();

  const proposalAuthority = useProposalAuthority(
    proposal.info.tokenOwnerRecord,
  );

  const onFinish = async (values: {
    slot: string;
    instruction: string;
    holdUpTime: number;
  }) => {
    let index = proposal.info.instructionsNextIndex;

    try {
      await insertInstruction(
        rpcContext,
        proposal,
        proposalAuthority!.pubkey,
        index,
        values.holdUpTime * 86400,
        values.instruction,
      );

      form.resetFields();
    } catch (ex) {
      console.log('ERROR', ex);
    }
  };

  const minHoldUpTime = governance.info.config.minInstructionHoldUpTime / 86400;

  return !proposalAuthority ? null : (
    <Card
      title="New Instruction"
      actions={[<SaveOutlined key="save" onClick={form.submit} />]}
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
          rules={[{ required: true }]}
        >
          <InstructionInput governance={governance}></InstructionInput>
        </Form.Item>
      </Form>
    </Card>
  );
}

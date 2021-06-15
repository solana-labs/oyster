import React from 'react';
import { Card, InputNumber } from 'antd';
import { Form } from 'antd';

import { contexts, ParsedAccount } from '@oyster/common';

import { SaveOutlined } from '@ant-design/icons';
import { LABELS } from '../../../constants';
import { Governance, Proposal } from '../../../models/accounts';

import { useProposalAuthority } from '../../../contexts/GovernanceContext';
import { insertInstruction } from '../../../actions/insertInstruction';
import '../style.less';

import { verticalFormLayout } from '../../../utils/forms';
import InstructionInput from './InstructionInput';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function NewInstructionCard({
  proposal,
  governance,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
}) {
  const [form] = Form.useForm();
  const { wallet } = useWallet();
  const connection = useConnection();

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
        connection,
        wallet,
        proposal,
        proposalAuthority!.pubkey,
        index,
        values.holdUpTime,
        values.instruction,
      );

      form.resetFields();
    } catch (ex) {
      console.log('ERROR', ex);
    }
  };

  return !proposalAuthority ? null : (
    <Card
      title="New Instruction"
      actions={[<SaveOutlined key="save" onClick={form.submit} />]}
    >
      <Form
        {...verticalFormLayout}
        form={form}
        name="control-hooks"
        onFinish={onFinish}
        initialValues={{
          holdUpTime:
            governance.info.config.minInstructionHoldUpTime.toNumber(),
        }}
      >
        <Form.Item
          name="holdUpTime"
          label={LABELS.HOLD_UP_TIME}
          rules={[{ required: true }]}
        >
          <InputNumber
            maxLength={64}
            min={governance.info.config.minInstructionHoldUpTime.toNumber()}
          />
        </Form.Item>

        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true }]}
        >
          <InstructionInput governance={governance}></InstructionInput>
        </Form.Item>
      </Form>
    </Card>
  );
}

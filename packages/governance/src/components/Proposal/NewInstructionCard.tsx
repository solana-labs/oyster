import React from 'react';
import { Card } from 'antd';
import { Form, Input } from 'antd';
import { INSTRUCTION_LIMIT } from '../../models/serialisation';
import { contexts, ParsedAccount, utils } from '@oyster/common';

import { SaveOutlined } from '@ant-design/icons';
import { LABELS } from '../../constants';
import { Governance, Proposal } from '../../models/accounts';

import { useProposalAuthority } from '../../contexts/proposals';
import { insertInstruction } from '../../actions/insertInstruction';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

const { notify } = utils;

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

export function NewInstructionCard({
  proposal,
  position,
  governance,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
  position: number;
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
    destination?: string;
  }) => {
    // if (!values.slot.match(/^\d*$/)) {
    //   notify({
    //     message: LABELS.SLOT_MUST_BE_NUMERIC,
    //     type: 'error',
    //   });
    //   return;
    // }

    // if (
    //   parseInt(values.slot) <
    //   governance.info.config.minInstructionHoldUpTime.toNumber()
    // ) {
    //   notify({
    //     message:
    //       LABELS.SLOT_MUST_BE_GREATER_THAN +
    //       governance.info.config.minInstructionHoldUpTime.toString(),
    //     type: 'error',
    //   });
    //   return;
    // }

    //let instruction = values.instruction;

    try {
      await insertInstruction(
        connection,
        wallet,
        proposal,
        proposalAuthority!.pubkey,
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
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item
          name="slot"
          label={LABELS.HOLD_UP_TIME}
          // rules={[{ required: true }]}
        >
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="instruction"
          label="Instruction"
          // rules={[{ required: true }]}
        >
          <Input.TextArea
            maxLength={INSTRUCTION_LIMIT}
            placeholder={`Base64 encoded Solana Message object with single instruction (call message.serialize().toString('base64')) no more than ${INSTRUCTION_LIMIT} characters`}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}

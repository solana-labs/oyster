import React from 'react';
import { Card } from 'antd';
import { Form, Input } from 'antd';
import { MAX_INSTRUCTION_BASE64_LENGTH } from '../../models/serialisation';
import { contexts, ParsedAccount } from '@oyster/common';

import { SaveOutlined } from '@ant-design/icons';
import { LABELS } from '../../constants';
import { Governance, Proposal } from '../../models/accounts';

import { useProposalAuthority } from '../../contexts/GovernanceContext';
import { insertInstruction } from '../../actions/insertInstruction';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

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

      //    await executeInstruction(connection, wallet, proposal);

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
        {...layout}
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
          <Input
            maxLength={64}
            min={governance.info.config.minInstructionHoldUpTime.toNumber()}
          />
        </Form.Item>
        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true }]}
        >
          <Input.TextArea
            maxLength={MAX_INSTRUCTION_BASE64_LENGTH}
            placeholder={`base64 encoded serialized Solana Instruction`}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}

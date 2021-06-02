import React from 'react';
import { Card } from 'antd';
import { Form, Input } from 'antd';
import {
  INSTRUCTION_LIMIT,
  GovernanceOld,
  Proposal,
  ProposalState,
} from '../../models/serialisation';
import { contexts, ParsedAccount, hooks, utils } from '@oyster/common';
import { addCustomSingleSignerTransaction } from '../../actions/addCustomSingleSignerTransaction';
import { SaveOutlined } from '@ant-design/icons';
import { LABELS } from '../../constants';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;
const { notify } = utils;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

export function NewInstructionCard({
  proposal,
  state,
  position,
  config,
}: {
  proposal: ParsedAccount<Proposal>;
  state: ParsedAccount<ProposalState>;
  config: ParsedAccount<GovernanceOld>;
  position: number;
}) {
  const [form] = Form.useForm();
  const wallet = useWallet();
  const connection = useConnection();
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);

  const onFinish = async (values: {
    slot: string;
    instruction: string;
    destination?: string;
  }) => {
    if (!values.slot.match(/^\d*$/)) {
      notify({
        message: LABELS.SLOT_MUST_BE_NUMERIC,
        type: 'error',
      });
      return;
    }

    if (
      parseInt(values.slot) < config.info.minimumSlotWaitingPeriod.toNumber()
    ) {
      notify({
        message:
          LABELS.SLOT_MUST_BE_GREATER_THAN +
          config.info.minimumSlotWaitingPeriod.toString(),
        type: 'error',
      });
      return;
    }

    let instruction = values.instruction;

    if (sigAccount) {
      await addCustomSingleSignerTransaction(
        connection,
        wallet.wallet,
        proposal,
        state,
        sigAccount.pubkey,
        values.slot,
        instruction,
        position,
      );
      form.resetFields();
    }
  };

  return !sigAccount ? null : (
    <Card
      title="New Instruction"
      actions={[<SaveOutlined key="save" onClick={form.submit} />]}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item
          name="slot"
          label={LABELS.DELAY}
          rules={[{ required: true }]}
        >
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true }]}
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

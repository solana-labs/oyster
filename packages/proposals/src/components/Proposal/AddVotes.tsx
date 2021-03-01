import { ParsedAccount } from '@oyster/common';
import { Button, Modal, Input, Form, Progress, InputNumber, Radio } from 'antd';
import React, { useState } from 'react';
import { TimelockSet } from '../../models/timelock';
import { utils, contexts, hooks } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { LABELS } from '../../constants';
import { mintVotingTokens } from '../../actions/mintVotingTokens';

const { notify } = utils;
const { TextArea } = Input;
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;
const { deserializeAccount } = contexts.Accounts;

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

export default function AddVotes({
  proposal,
}: {
  proposal: ParsedAccount<TimelockSet>;
}) {
  const PROGRAM_IDS = utils.programIds();
  const wallet = useWallet();
  const connection = useConnection();
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bulkModeVisible, setBulkModeVisible] = useState(false);
  const [savePerc, setSavePerc] = useState(0);
  const [failedVoters, setFailedVoters] = useState<any>([]);
  const [form] = Form.useForm();

  const onSubmit = async (values: {
    voters: string;
    failedVoters: string;
    singleVoter: string;
    singleVoteCount: number;
  }) => {
    const { singleVoter, singleVoteCount } = values;
    const votersAndCounts = values.voters
      ? values.voters.split(',').map(s => s.trim())
      : [];
    const voters: any[] = [];
    votersAndCounts.forEach((value: string, index: number) => {
      if (index % 2 == 0) voters.push([value, 0]);
      else voters[voters.length - 1][1] = parseInt(value);
    });
    console.log('Voters', votersAndCounts);
    if (singleVoter) voters.push([singleVoter, singleVoteCount]);

    if (!sigAccount) {
      notify({
        message: LABELS.SIG_ACCOUNT_NOT_DEFINED,
        type: 'error',
      });
      return;
    }
    if (!voters.find(v => v[0])) {
      notify({
        message: LABELS.ENTER_AT_LEAST_ONE_PUB_KEY,
        type: 'error',
      });
      return;
    }
    setSaving(true);

    if (voters.find(v => v[1] === 0)) {
      notify({
        message: LABELS.CANT_GIVE_ZERO_VOTES,
        type: 'error',
      });
      setSaving(false);
      return;
    }

    const failedVotersHold: any[] = [];

    for (let i = 0; i < voters.length; i++) {
      try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(
          new PublicKey(voters[i][0]),
          {
            programId: PROGRAM_IDS.token,
          },
        );
        const specificToThisMint = tokenAccounts.value.find(
          a =>
            deserializeAccount(a.account.data).mint.toBase58() ===
            proposal.info.votingMint.toBase58(),
        );
        await mintVotingTokens(
          connection,
          wallet.wallet,
          proposal,
          sigAccount.pubkey,
          new PublicKey(voters[i][0]),
          specificToThisMint?.pubkey,
          voters[i][1],
        );
        setSavePerc(Math.round(100 * ((i + 1) / voters.length)));
      } catch (e) {
        console.error(e);
        failedVotersHold.push(voters[i]);
        notify({
          message: voters[i][0] + LABELS.PUB_KEY_FAILED,
          type: 'error',
        });
      }
    }
    setFailedVoters(failedVotersHold);
    setSaving(false);
    setSavePerc(0);
    setIsModalVisible(failedVotersHold.length > 0);
    if (failedVotersHold.length === 0) form.resetFields();
  };

  return (
    <>
      {sigAccount ? (
        <Button
          onClick={() => {
            setIsModalVisible(true);
          }}
        >
          {LABELS.ADD_VOTES}
        </Button>
      ) : null}
      <Modal
        title={LABELS.ADD_VOTES}
        visible={isModalVisible}
        destroyOnClose={true}
        onOk={form.submit}
        zIndex={10000}
        onCancel={() => {
          if (!saving) setIsModalVisible(false);
        }}
      >
        <Form
          className={'voters-form'}
          {...layout}
          form={form}
          onFinish={onSubmit}
          name="control-hooks"
        >
          {!saving && (
            <>
              <Form.Item
                label={LABELS.VOTE_MODE}
                name="voteMode"
                initialValue={LABELS.SINGLE}
                rules={[{ required: false }]}
              >
                <Radio.Group
                  value={layout}
                  onChange={e =>
                    setBulkModeVisible(e.target.value === LABELS.BULK)
                  }
                >
                  <Radio.Button value={LABELS.BULK}>{LABELS.BULK}</Radio.Button>
                  <Radio.Button value={LABELS.SINGLE}>
                    {LABELS.SINGLE}
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
              {!bulkModeVisible && (
                <>
                  <Form.Item
                    name="singleVoter"
                    label={LABELS.SINGLE_VOTER}
                    rules={[{ required: false }]}
                  >
                    <Input placeholder={LABELS.SINGLE_KEY} />
                  </Form.Item>
                  <Form.Item
                    name="singleVoteCount"
                    label={LABELS.VOTE_COUNT}
                    initialValue={0}
                    rules={[{ required: false }]}
                  >
                    <InputNumber />
                  </Form.Item>
                </>
              )}
              {bulkModeVisible && (
                <Form.Item
                  name="voters"
                  label={LABELS.BULK_VOTERS}
                  rules={[{ required: false }]}
                >
                  <TextArea
                    id="voters"
                    placeholder={LABELS.COMMA_SEPARATED_KEYS_AND_VOTES}
                  />
                </Form.Item>
              )}
            </>
          )}
        </Form>
        {saving && <Progress percent={savePerc} status="active" />}

        {!saving && failedVoters.length > 0 && (
          <div
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'space-evenly',
              alignItems: 'stretch',
              display: 'flex',
            }}
          >
            <Button
              onClick={() => {
                navigator.clipboard.writeText(failedVoters.join(','));
                notify({
                  message: LABELS.FAILED_SIGNERS_COPIED_TO_CLIPBOARD,
                  type: 'success',
                });
              }}
            >
              {LABELS.COPY_FAILED_ADDRESSES_TO_CLIPBOARD}
            </Button>
            <br />
            <Button
              onClick={() => {
                form.setFieldsValue({
                  voters: failedVoters.join(','),
                });
                notify({
                  message: LABELS.FAILED_SIGNERS_COPIED_TO_INPUT,
                  type: 'success',
                });
              }}
            >
              {LABELS.COPY_FAILED_ADDRESSES_TO_INPUT}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

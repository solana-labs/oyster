import { ParsedAccount, programIds } from '@oyster/common';
import { Button, Modal, Input, Form, Progress, InputNumber, Radio } from 'antd';
import React, { useEffect, useState } from 'react';
import { TimelockConfig, TimelockSet } from '../../models/timelock';
import { utils, contexts, hooks } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { LABELS } from '../../constants';
import {
  GovernanceEntryInterface,
  mintGovernanceTokens,
} from '../../actions/mintGovernanceTokens';

const { notify } = utils;
const { TextArea } = Input;
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { deserializeAccount, useMint } = contexts.Accounts;

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

export default function MintGovernanceTokens({
  timelockConfig,
}: {
  timelockConfig: ParsedAccount<TimelockConfig>;
}) {
  const PROGRAM_IDS = utils.programIds();
  const wallet = useWallet();
  const connection = useConnection();
  const governanceMint = useMint(timelockConfig.info.governanceMint);

  const [saving, setSaving] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bulkModeVisible, setBulkModeVisible] = useState(false);
  const [savePerc, setSavePerc] = useState(0);
  const [failedGovernances, setFailedGovernances] = useState<any>([]);
  const [form] = Form.useForm();

  const onSubmit = async (values: {
    governanceHolders: string;
    failedGovernances: string;
    singleGovernanceHolder: string;
    singleGovernanceCount: number;
  }) => {
    const { singleGovernanceHolder, singleGovernanceCount } = values;
    const governanceHoldersAndCounts = values.governanceHolders
      ? values.governanceHolders.split(',').map(s => s.trim())
      : [];
    const governanceHolders: GovernanceEntryInterface[] = [];
    let failedGovernancesHold: GovernanceEntryInterface[] = [];
    const zeroKey = PROGRAM_IDS.system;
    governanceHoldersAndCounts.forEach((value: string, index: number) => {
      if (index % 2 == 0)
        governanceHolders.push({
          owner: value ? new PublicKey(value) : zeroKey,
          tokenAmount: 0,
          governanceAccount: undefined,
        });
      else
        governanceHolders[governanceHolders.length - 1].tokenAmount = parseInt(
          value,
        );
    });
    console.log(governanceHolders);

    if (singleGovernanceHolder)
      governanceHolders.push({
        owner: singleGovernanceHolder
          ? new PublicKey(singleGovernanceHolder)
          : zeroKey,
        tokenAmount: singleGovernanceCount,
        governanceAccount: undefined,
      });

    if (!governanceHolders.find(v => v.owner != zeroKey)) {
      notify({
        message: LABELS.ENTER_AT_LEAST_ONE_PUB_KEY,
        type: 'error',
      });
      return;
    }

    if (governanceHolders.find(v => v.tokenAmount === 0)) {
      notify({
        message: LABELS.CANT_GIVE_ZERO_TOKENS,
        type: 'error',
      });
      setSaving(false);
      return;
    }

    setSaving(true);

    const failedGovernanceCatch = (index: number, error: any) => {
      if (error) console.error(error);
      failedGovernancesHold.push(governanceHolders[index]);
      notify({
        message:
          governanceHolders[index].owner?.toBase58() + LABELS.PUB_KEY_FAILED,
        type: 'error',
      });
    };

    const governanceHoldersToRun = [];
    for (let i = 0; i < governanceHolders.length; i++) {
      try {
        console.log('Running', governanceHolders[i]);
        if (governanceHolders[i].owner) {
          const tokenAccounts = await connection.getTokenAccountsByOwner(
            governanceHolders[i].owner || PROGRAM_IDS.timelock,
            {
              programId: PROGRAM_IDS.token,
            },
          );
          const specificToThisMint = tokenAccounts.value.find(
            a =>
              deserializeAccount(a.account.data).mint.toBase58() ===
              timelockConfig.info.governanceMint.toBase58(),
          );
          governanceHolders[i].governanceAccount = specificToThisMint?.pubkey;
          governanceHoldersToRun.push(governanceHolders[i]);
        }
      } catch (e) {
        failedGovernanceCatch(i, e);
      }
    }

    try {
      await mintGovernanceTokens(
        connection,
        wallet.wallet,
        timelockConfig,
        governanceHoldersToRun,
        setSavePerc,
        index => failedGovernanceCatch(index, null),
      );
    } catch (e) {
      console.error(e);
      failedGovernancesHold = governanceHolders;
    }

    setFailedGovernances(failedGovernancesHold);
    setSaving(false);
    setSavePerc(0);
    setIsModalVisible(failedGovernancesHold.length > 0);
    if (failedGovernancesHold.length === 0) form.resetFields();
  };
  return (
    <>
      {governanceMint?.mintAuthority?.toBase58() ===
      wallet.wallet?.publicKey?.toBase58() ? (
        <Button
          onClick={() => {
            setIsModalVisible(true);
          }}
        >
          {LABELS.ADD_GOVERNANCE_TOKENS}
        </Button>
      ) : null}
      <Modal
        title={LABELS.ADD_GOVERNANCE_TOKENS}
        visible={isModalVisible}
        destroyOnClose={true}
        onOk={form.submit}
        zIndex={10000}
        onCancel={() => {
          if (!saving) setIsModalVisible(false);
        }}
      >
        <Form
          className={'governance-form'}
          {...layout}
          form={form}
          onFinish={onSubmit}
          name="control-hooks"
        >
          {!saving && (
            <>
              <Form.Item
                label={LABELS.TOKEN_MODE}
                name="tokenMode"
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
                    name="singleGovernanceHolder"
                    label={LABELS.SINGLE_HOLDER}
                    rules={[{ required: false }]}
                  >
                    <Input placeholder={LABELS.SINGLE_KEY} />
                  </Form.Item>
                  <Form.Item
                    name="singleGovernanceCount"
                    label={LABELS.AMOUNT}
                    initialValue={0}
                    rules={[{ required: false }]}
                  >
                    <InputNumber />
                  </Form.Item>
                </>
              )}
              {bulkModeVisible && (
                <Form.Item
                  name="governanceHolders"
                  label={LABELS.BULK_TOKENS}
                  rules={[{ required: false }]}
                >
                  <TextArea
                    placeholder={LABELS.COMMA_SEPARATED_KEYS_AND_VOTES}
                  />
                </Form.Item>
              )}
            </>
          )}
        </Form>
        {saving && <Progress percent={savePerc} status="active" />}

        {!saving && failedGovernances.length > 0 && bulkModeVisible && (
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
                navigator.clipboard.writeText(failedGovernances.join(','));
                notify({
                  message: LABELS.FAILED_HOLDERS_COPIED_TO_CLIPBOARD,
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
                  governances: failedGovernances.join(','),
                });
                notify({
                  message: LABELS.FAILED_HOLDERS_COPIED_TO_INPUT,
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

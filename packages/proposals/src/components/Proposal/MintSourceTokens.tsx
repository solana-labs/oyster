import { ParsedAccount } from '@oyster/common';
import { Button, Modal, Input, Form, Progress, InputNumber, Radio } from 'antd';
import React, { useState } from 'react';
import { TimelockConfig } from '../../models/timelock';
import { utils, contexts } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { LABELS } from '../../constants';
import {
  SourceEntryInterface,
  mintSourceTokens,
} from '../../actions/mintSourceTokens';

const { notify } = utils;
const { TextArea } = Input;
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { deserializeAccount, useMint } = contexts.Accounts;

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

export default function MintSourceTokens({
  timelockConfig,
  useGovernance,
}: {
  timelockConfig: ParsedAccount<TimelockConfig>;
  useGovernance: boolean;
}) {
  const PROGRAM_IDS = utils.programIds();
  const wallet = useWallet();
  const connection = useConnection();
  const mintKey = useGovernance
    ? timelockConfig.info.governanceMint
    : timelockConfig.info.councilMint!;
  const mint = useMint(mintKey);
  const [saving, setSaving] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bulkModeVisible, setBulkModeVisible] = useState(false);
  const [savePerc, setSavePerc] = useState(0);
  const [failedSources, setFailedSources] = useState<any>([]);
  const [form] = Form.useForm();

  const onSubmit = async (values: {
    sourceHolders: string;
    failedSources: string;
    singleSourceHolder: string;
    singleSourceCount: number;
  }) => {
    const { singleSourceHolder, singleSourceCount } = values;
    const sourceHoldersAndCounts = values.sourceHolders
      ? values.sourceHolders.split(',').map(s => s.trim())
      : [];
    const sourceHolders: SourceEntryInterface[] = [];
    let failedSourcesHold: SourceEntryInterface[] = [];
    const zeroKey = PROGRAM_IDS.system;
    sourceHoldersAndCounts.forEach((value: string, index: number) => {
      if (index % 2 == 0)
        sourceHolders.push({
          owner: value ? new PublicKey(value) : zeroKey,
          tokenAmount: 0,
          sourceAccount: undefined,
        });
      else
        sourceHolders[sourceHolders.length - 1].tokenAmount = parseInt(value);
    });
    //console.log(sourceHolders);

    if (singleSourceHolder)
      sourceHolders.push({
        owner: singleSourceHolder ? new PublicKey(singleSourceHolder) : zeroKey,
        tokenAmount: singleSourceCount,
        sourceAccount: undefined,
      });

    if (!sourceHolders.find(v => v.owner != zeroKey)) {
      notify({
        message: LABELS.ENTER_AT_LEAST_ONE_PUB_KEY,
        type: 'error',
      });
      return;
    }

    if (sourceHolders.find(v => v.tokenAmount === 0)) {
      notify({
        message: LABELS.CANT_GIVE_ZERO_TOKENS,
        type: 'error',
      });
      setSaving(false);
      return;
    }

    setSaving(true);

    const failedSourceCatch = (index: number, error: any) => {
      if (error) console.error(error);
      failedSourcesHold.push(sourceHolders[index]);
      notify({
        message: sourceHolders[index].owner?.toBase58() + LABELS.PUB_KEY_FAILED,
        type: 'error',
      });
    };

    const sourceHoldersToRun = [];
    for (let i = 0; i < sourceHolders.length; i++) {
      try {
        if (sourceHolders[i].owner) {
          const tokenAccounts = await connection.getTokenAccountsByOwner(
            sourceHolders[i].owner || PROGRAM_IDS.timelock,
            {
              programId: PROGRAM_IDS.token,
            },
          );
          const specificToThisMint = tokenAccounts.value.find(
            a =>
              deserializeAccount(a.account.data).mint.toBase58() ===
              mintKey.toBase58(),
          );
          sourceHolders[i].sourceAccount = specificToThisMint?.pubkey;
          sourceHoldersToRun.push(sourceHolders[i]);
        }
      } catch (e) {
        failedSourceCatch(i, e);
      }
    }

    try {
      await mintSourceTokens(
        connection,
        wallet.wallet,
        timelockConfig,
        useGovernance,
        sourceHoldersToRun,
        setSavePerc,
        index => failedSourceCatch(index, null),
      );
    } catch (e) {
      console.error(e);
      failedSourcesHold = sourceHolders;
    }

    setFailedSources(failedSourcesHold);
    setSaving(false);
    setSavePerc(0);
    setIsModalVisible(failedSourcesHold.length > 0);
    if (failedSourcesHold.length === 0) form.resetFields();
  };
  return (
    <>
      {mint?.mintAuthority?.toBase58() ===
      wallet.wallet?.publicKey?.toBase58() ? (
        <Button
          onClick={() => {
            setIsModalVisible(true);
          }}
        >
          {useGovernance
            ? LABELS.ADD_GOVERNANCE_TOKENS
            : LABELS.ADD_COUNCIL_TOKENS}
        </Button>
      ) : null}
      <Modal
        title={
          useGovernance
            ? LABELS.ADD_GOVERNANCE_TOKENS
            : LABELS.ADD_COUNCIL_TOKENS
        }
        visible={isModalVisible}
        destroyOnClose={true}
        onOk={form.submit}
        zIndex={10000}
        onCancel={() => {
          if (!saving) setIsModalVisible(false);
        }}
      >
        <Form
          className={'source-form'}
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
                    name="singleSourceHolder"
                    label={LABELS.SINGLE_HOLDER}
                    rules={[{ required: false }]}
                  >
                    <Input placeholder={LABELS.SINGLE_KEY} />
                  </Form.Item>
                  <Form.Item
                    name="singleSourceCount"
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
                  name="sourceHolders"
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

        {!saving && failedSources.length > 0 && bulkModeVisible && (
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
                navigator.clipboard.writeText(failedSources.join(','));
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
                  sources: failedSources.join(','),
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

import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row, Slider, Switch } from 'antd';
import React, { useState } from 'react';
import {
  TimelockConfig,
  TimelockSet,
  TimelockState,
  TimelockStateStatus,
} from '../../models/timelock';
import { LABELS } from '../../constants';
import { vote } from '../../actions/vote';
import { contexts, hooks } from '@oyster/common';
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function Vote({
  proposal,
  state,
  timelockConfig,
}: {
  proposal: ParsedAccount<TimelockSet>;
  state: ParsedAccount<TimelockState>;
  timelockConfig: ParsedAccount<TimelockConfig>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const voteAccount = useAccountByMint(proposal.info.votingMint);
  const yesVoteAccount = useAccountByMint(proposal.info.yesVotingMint);
  const noVoteAccount = useAccountByMint(proposal.info.noVotingMint);
  const [mode, setMode] = useState(true);
  const [_, setTokenAmount] = useState(1);
  const eligibleToView =
    voteAccount &&
    voteAccount.info.amount.toNumber() > 0 &&
    state.info.status === TimelockStateStatus.Voting;
  return eligibleToView ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: 'Confirm',
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>
                  Burning your {voteAccount?.info.amount.toNumber()} tokens is
                  an irreversible action. Choose how many to burn in favor OR
                  against this proposal. Use the switch to indicate preference.
                </p>
                <Slider
                  min={1}
                  max={voteAccount?.info.amount.toNumber()}
                  onChange={setTokenAmount}
                />
                <Switch
                  checkedChildren={<CheckOutlined />}
                  unCheckedChildren={<CloseOutlined />}
                  defaultChecked
                  onChange={setMode}
                />
              </Col>
            </Row>
          ),
          okText: LABELS.CONFIRM,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (voteAccount && yesVoteAccount && noVoteAccount) {
              // tokenAmount and mode is out of date in this scope, so we use a trick to get it here.
              const valueHolder = { value: 0, mode: true };
              await setTokenAmount(amount => {
                valueHolder.value = amount;
                return amount;
              });
              await setMode(mode => {
                valueHolder.mode = mode;
                return mode;
              });
              const yesTokenAmount = valueHolder.mode ? valueHolder.value : 0;
              const noTokenAmount = !valueHolder.mode ? valueHolder.value : 0;
              await vote(
                connection,
                wallet.wallet,
                proposal,
                timelockConfig,
                state,
                voteAccount.pubkey,
                yesVoteAccount.pubkey,
                noVoteAccount.pubkey,
                yesTokenAmount,
                noTokenAmount,
              );
              // reset
              setTokenAmount(1);
            }
          },
        })
      }
    >
      {LABELS.VOTE}
    </Button>
  ) : null;
}

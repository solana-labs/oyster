import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row, Switch } from 'antd';
import React, { useState } from 'react';
import {
  TimelockConfig,
  TimelockSet,
  TimelockState,
  TimelockStateStatus,
  VotingEntryRule,
} from '../../models/timelock';
import { LABELS } from '../../constants';
import { depositSourceTokensAndVote } from '../../actions/depositSourceTokensAndVote';
import { contexts, hooks } from '@oyster/common';
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { cache } = contexts.Accounts;

const { confirm } = Modal;
export function QuickVote({
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

  const userTokenAccount = useAccountByMint(proposal.info.sourceMint);
  const alreadyHaveTokens =
    (voteAccount && voteAccount.info.amount.toNumber() > 0) ||
    (yesVoteAccount && yesVoteAccount.info.amount.toNumber() > 0) ||
    (noVoteAccount && noVoteAccount.info.amount.toNumber() > 0);

  const [mode, setMode] = useState(true);

  const eligibleToView =
    timelockConfig.info.votingEntryRule == VotingEntryRule.Anytime &&
    [TimelockStateStatus.Draft, TimelockStateStatus.Voting].includes(
      state.info.status,
    );

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
                  Use {userTokenAccount?.info.amount.toNumber() || 0} tokens to
                  vote in favor OR against this proposal. You can refund these
                  at any time. Use the switch to indicate preference.
                </p>
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
            if (userTokenAccount) {
              // mode is out of date in this scope, so we use a trick to get it here.
              const valueHolder = { mode: true };
              await setMode(mode => {
                valueHolder.mode = mode;
                return mode;
              });

              const voteAmount = userTokenAccount.info.amount.toNumber();

              const yesTokenAmount = valueHolder.mode ? voteAmount : 0;
              const noTokenAmount = !valueHolder.mode ? voteAmount : 0;

              await depositSourceTokensAndVote(
                connection,
                wallet.wallet,
                proposal,
                voteAccount?.pubkey,
                yesVoteAccount?.pubkey,
                noVoteAccount?.pubkey,
                userTokenAccount.pubkey,
                timelockConfig,
                state,
                yesTokenAmount,
                noTokenAmount,
              );
            }
          },
        })
      }
    >
      {LABELS.QUICK_VOTE}
    </Button>
  ) : null;
}

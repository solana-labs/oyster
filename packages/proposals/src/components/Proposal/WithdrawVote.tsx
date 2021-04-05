import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import {
  TimelockConfig,
  TimelockSet,
  TimelockState,
  TimelockStateStatus,
} from '../../models/timelock';
import { LABELS } from '../../constants';
import { withdrawVotingTokens } from '../../actions/withdrawVotingTokens';
import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function WithdrawVote({
  proposal,
  state,
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

  const userAccount = useAccountByMint(proposal.info.sourceMint);

  const votingTokens =
    (voteAccount && voteAccount.info.amount.toNumber()) ||
    0 +
      ((yesVoteAccount && yesVoteAccount.info.amount.toNumber()) || 0) +
      ((noVoteAccount && noVoteAccount.info.amount.toNumber()) || 0);

  const eligibleToView =
    votingTokens > 0 && state.info.status === TimelockStateStatus.Voting;

  return eligibleToView ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: LABELS.WITHDRAW_YOUR_VOTE_QUESTION,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{LABELS.WITHDRAW_YOUR_VOTE_MSG}</p>
              </Col>
            </Row>
          ),
          okText: LABELS.WITHDRAW,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (userAccount) {
              await withdrawVotingTokens(
                connection,
                wallet.wallet,
                proposal,
                state,
                voteAccount?.pubkey,
                yesVoteAccount?.pubkey,
                noVoteAccount?.pubkey,
                userAccount.pubkey,
                votingTokens,
              );
            }
          },
        })
      }
    >
      {LABELS.WITHDRAW_VOTE}
    </Button>
  ) : null;
}

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
import { depositSourceTokensAndVote } from '../../actions/depositSourceTokensAndVote';
import { contexts, hooks } from '@oyster/common';
import {
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

import './style.less';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function Vote({
  proposal,
  state,
  timelockConfig,
  yeahVote,
}: {
  proposal: ParsedAccount<TimelockSet>;
  state: ParsedAccount<TimelockState>;
  timelockConfig: ParsedAccount<TimelockConfig>;
  yeahVote: boolean;
}) {
  const wallet = useWallet();
  const connection = useConnection();

  const voteAccount = useAccountByMint(proposal.info.votingMint);
  const yesVoteAccount = useAccountByMint(proposal.info.yesVotingMint);
  const noVoteAccount = useAccountByMint(proposal.info.noVotingMint);

  const userTokenAccount = useAccountByMint(proposal.info.sourceMint);

  const eligibleToView =
    userTokenAccount &&
    userTokenAccount.info.amount.toNumber() > 0 &&
    state.info.status === TimelockStateStatus.Voting;

  const [btnLabel, title, msg, icon] = yeahVote
    ? [
        LABELS.VOTE_YEAH,
        LABELS.VOTE_YEAH_QUESTION,
        LABELS.VOTE_YEAH_MSG,
        <CheckOutlined />,
      ]
    : [
        LABELS.VOTE_NAY,
        LABELS.VOTE_NAY_QUESTION,
        LABELS.VOTE_NAY_MSG,
        <CloseOutlined />,
      ];

  return eligibleToView ? (
    <Button
      type="primary"
      icon={icon}
      onClick={() =>
        confirm({
          title: title,
          icon: icon,
          content: (
            <Row>
              <Col span={24}>
                <p>{msg}</p>
              </Col>
            </Row>
          ),
          okText: LABELS.CONFIRM,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (userTokenAccount) {
              const voteAmount = userTokenAccount.info.amount.toNumber();

              const yesTokenAmount = yeahVote ? voteAmount : 0;
              const noTokenAmount = !yeahVote ? voteAmount : 0;

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
      {btnLabel}
    </Button>
  ) : null;
}

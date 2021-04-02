import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row, Switch, Radio } from 'antd';
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
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useLatestState } from '../../hooks/useLatestState';
import './style.less';

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

  const userTokenAccount = useAccountByMint(proposal.info.sourceMint);

  const [vote, setVote, getLatestVote] = useLatestState(0);

  const eligibleToView =
    userTokenAccount &&
    userTokenAccount.info.amount.toNumber() > 0 &&
    state.info.status === TimelockStateStatus.Voting;

  return eligibleToView ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: LABELS.VOTE,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>
                  Use {userTokenAccount?.info.amount.toNumber()} tokens to vote
                  in favor or against this proposal. You can refund these at any
                  time.
                </p>

                <Radio.Group
                  onChange={e => setVote(e.target.value)}
                  buttonStyle="solid"
                  className="vote-radio-group"
                >
                  <Radio.Button value={1}>Yea</Radio.Button>
                  <Radio.Button value={-1}>Nay</Radio.Button>
                </Radio.Group>
              </Col>
            </Row>
          ),
          okText: LABELS.CONFIRM,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            const vote = await getLatestVote();

            if (userTokenAccount && vote != 0) {
              const voteAmount = userTokenAccount.info.amount.toNumber();

              const yesTokenAmount = vote > 0 ? voteAmount : 0;
              const noTokenAmount = vote < 0 ? voteAmount : 0;

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
      {LABELS.VOTE}
    </Button>
  ) : null;
}

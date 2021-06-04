import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';

import { LABELS } from '../../constants';

import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Proposal, ProposalState } from '../../models/accounts';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function WithdrawVote({
  proposal,
}: {
  proposal: ParsedAccount<Proposal>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const voteAccount = useAccountByMint(proposal.info.governingTokenMint);
  const yesVoteAccount = useAccountByMint(proposal.info.governingTokenMint);
  const noVoteAccount = useAccountByMint(proposal.info.governingTokenMint);

  const userAccount = useAccountByMint(proposal.info.governingTokenMint);

  const votingTokens =
    (voteAccount && voteAccount.info.amount.toNumber()) ||
    0 +
      ((yesVoteAccount && yesVoteAccount.info.amount.toNumber()) || 0) +
      ((noVoteAccount && noVoteAccount.info.amount.toNumber()) || 0);

  const eligibleToView =
    votingTokens > 0 &&
    (proposal.info.state === ProposalState.Voting ||
      proposal.info.state === ProposalState.Completed ||
      proposal.info.state === ProposalState.Executing ||
      proposal.info.state === ProposalState.Defeated);

  const [btnLabel, title, msg, action] =
    proposal.info.state === ProposalState.Voting
      ? [
          LABELS.WITHDRAW_VOTE,
          LABELS.WITHDRAW_YOUR_VOTE_QUESTION,
          LABELS.WITHDRAW_YOUR_VOTE_MSG,
          LABELS.WITHDRAW,
        ]
      : [
          LABELS.REFUND_TOKENS,
          LABELS.REFUND_YOUR_TOKENS_QUESTION,
          LABELS.REFUND_YOUR_TOKENS_MSG,
          LABELS.REFUND,
        ];

  return eligibleToView ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: title,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{msg}</p>
              </Col>
            </Row>
          ),
          okText: action,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (userAccount) {
              console.log('TODO:', { wallet, connection });
              // await withdrawVotingTokens(
              //   connection,
              //   wallet.wallet,
              //   null,
              //   state,
              //   voteAccount?.pubkey,
              //   yesVoteAccount?.pubkey,
              //   noVoteAccount?.pubkey,
              //   userAccount.pubkey,
              //   votingTokens,
              // );
            }
          },
        })
      }
    >
      {btnLabel}
    </Button>
  ) : null;
}

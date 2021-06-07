import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';

import { LABELS } from '../../constants';

import { contexts } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Proposal, ProposalState } from '../../models/accounts';
import { useVoteRecord } from '../../contexts/GovernanceContext';
import { relinquishVote } from '../../actions/relinquishVote';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

const { confirm } = Modal;
export function WithdrawVote({
  proposal,
}: {
  proposal: ParsedAccount<Proposal>;
}) {
  const { wallet, connected } = useWallet();
  const connection = useConnection();

  const voteRecord = useVoteRecord(proposal.pubkey);

  const eligibleToView =
    connected &&
    voteRecord &&
    !voteRecord?.info.isRelinquished &&
    (proposal.info.state === ProposalState.Voting ||
      proposal.info.state === ProposalState.Completed ||
      proposal.info.state === ProposalState.Succeeded ||
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
            await relinquishVote(
              connection,
              wallet,
              proposal,
              voteRecord!.pubkey,
            );
          },
        })
      }
    >
      {btnLabel}
    </Button>
  ) : null;
}

import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';

import { LABELS } from '../../constants';

import { contexts } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Proposal, ProposalState } from '../../models/accounts';
import {
  useGovernanceContext,
  useVoteRecord,
} from '../../contexts/GovernanceContext';
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
  const { removeVoteRecord } = useGovernanceContext();

  const isVisible =
    connected &&
    voteRecord &&
    !voteRecord?.info.isRelinquished &&
    (proposal.info.state === ProposalState.Voting ||
      proposal.info.state === ProposalState.Completed ||
      proposal.info.state === ProposalState.Succeeded ||
      proposal.info.state === ProposalState.Executing ||
      proposal.info.state === ProposalState.Defeated);

  return isVisible ? (
    <Button
      type="primary"
      onClick={async () => {
        if (proposal.info.state !== ProposalState.Voting) {
          await relinquishVote(
            connection,
            wallet,
            proposal,
            voteRecord!.pubkey,
            false,
          );
          removeVoteRecord(voteRecord!.pubkey.toBase58());
          return;
        }

        confirm({
          title: LABELS.WITHDRAW_VOTE,
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
            await relinquishVote(
              connection,
              wallet,
              proposal,
              voteRecord!.pubkey,
              true,
            );
            removeVoteRecord(voteRecord!.pubkey.toBase58());
          },
        });
      }}
    >
      {proposal.info.state === ProposalState.Voting
        ? LABELS.WITHDRAW_VOTE
        : LABELS.RELEASE_MY_TOKENS}
    </Button>
  ) : null;
}

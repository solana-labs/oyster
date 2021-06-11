import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';

import { LABELS } from '../../../constants';

import { contexts } from '@oyster/common';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useWalletVoteRecord } from '../../../contexts/GovernanceContext';

import './style.less';

import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
} from '../../../models/accounts';

import { Vote } from '../../../models/instructions';

import { castVote } from '../../../actions/castVote';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

const { confirm } = Modal;
export function CastVote({
  proposal,
  governance,
  tokenOwnerRecord,
  vote,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord>;
  vote: Vote;
}) {
  const { wallet } = useWallet();
  const connection = useConnection();
  const voteRecord = useWalletVoteRecord(proposal.pubkey);

  const eligibleToView =
    !voteRecord &&
    tokenOwnerRecord.info.governingTokenDepositAmount.toNumber() > 0 &&
    proposal.info.state === ProposalState.Voting;

  const [btnLabel, title, msg, icon] =
    vote === Vote.Yes
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
            castVote(
              connection,
              wallet,
              proposal,
              tokenOwnerRecord.pubkey,
              vote,
            );
          },
        })
      }
    >
      {btnLabel}
    </Button>
  ) : null;
}

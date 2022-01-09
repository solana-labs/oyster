import { Button, Col, Modal, Row } from 'antd';
import React from 'react';

import { LABELS } from '../../../../constants';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import '../style.less';

import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
  VoteRecord,
} from '@solana/governance-sdk';

import { YesNoVote } from '@solana/governance-sdk';

import { castVote } from '../../../../actions/castVote';

import { useRpcContext } from '../../../../hooks/useRpcContext';
import { Option } from '../../../../tools/option';
import { ProgramAccount } from '@solana/governance-sdk';

const { confirm } = Modal;
export function CastVoteButton({
  proposal,
  governance,
  tokenOwnerRecord,
  vote,
  voteRecord,
  hasVoteTimeExpired,
}: {
  proposal: ProgramAccount<Proposal>;
  governance: ProgramAccount<Governance>;
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>;
  vote: YesNoVote;
  voteRecord: Option<ProgramAccount<VoteRecord>> | undefined;
  hasVoteTimeExpired: boolean | undefined;
}) {
  const rpcContext = useRpcContext();

  const isVisible =
    hasVoteTimeExpired === false &&
    voteRecord?.isNone() &&
    tokenOwnerRecord &&
    !tokenOwnerRecord.account.governingTokenDepositAmount.isZero() &&
    proposal.account.state === ProposalState.Voting;

  const [btnLabel, title, msg, icon] =
    vote === YesNoVote.Yes
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

  return isVisible ? (
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
              rpcContext,
              governance.account.realm,
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

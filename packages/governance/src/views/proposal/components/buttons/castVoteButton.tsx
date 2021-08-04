import { ParsedAccount } from '@oyster/common';
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
} from '../../../../models/accounts';

import { Vote } from '../../../../models/instructions';

import { castVote } from '../../../../actions/castVote';
import { useHasVoteTimeExpired } from '../../../../hooks/useHasVoteTimeExpired';
import { useWalletVoteRecord } from '../../../../hooks/apiHooks';
import { useRpcContext } from '../../../../hooks/useRpcContext';

const { confirm } = Modal;
export function CastVoteButton({
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
  const rpcContext = useRpcContext();
  const voteRecord = useWalletVoteRecord(proposal.pubkey);
  const hasVoteTimeExpired = useHasVoteTimeExpired(governance, proposal);

  const isVisible =
    hasVoteTimeExpired === false &&
    !voteRecord &&
    tokenOwnerRecord &&
    !tokenOwnerRecord.info.governingTokenDepositAmount.isZero() &&
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
              governance.info.realm,
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

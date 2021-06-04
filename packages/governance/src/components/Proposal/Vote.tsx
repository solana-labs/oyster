import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';

import { LABELS } from '../../constants';

import { contexts, hooks } from '@oyster/common';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import './style.less';
import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
} from '../../models/accounts';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function Vote({
  proposal,
  governance,
  tokenOwnerRecord,
  yeahVote,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord>;
  yeahVote: boolean;
}) {
  const wallet = useWallet();
  const connection = useConnection();

  const userTokenAccount = useAccountByMint(proposal.info.governingTokenMint);

  const eligibleToView =
    tokenOwnerRecord.info.governingTokenDepositAmount.toNumber() > 0 &&
    proposal.info.state === ProposalState.Voting;

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

              console.log('TODO:', { wallet, connection, voteAmount });
              // await depositSourceTokensAndVote(
              //   connection,
              //   wallet.wallet,
              //   null,
              //   voteAccount?.pubkey,
              //   yesVoteAccount?.pubkey,
              //   noVoteAccount?.pubkey,
              //   userTokenAccount.pubkey,
              //   governance,
              //   state,
              //   yesTokenAmount,
              //   noTokenAmount,
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

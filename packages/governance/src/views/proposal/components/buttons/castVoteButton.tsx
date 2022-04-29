import { Button, Col, Modal, Row, Radio } from 'antd';
import React, { useState } from 'react';

import { LABELS } from '../../../../constants';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import '../style.less';

import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
  VoteRecord,
  YesNoVote,
  ProgramAccount,
} from '@solana/spl-governance';

import { castVote } from '../../../../actions/castVote';

import { useRpcContext } from '../../../../hooks/useRpcContext';
import { Option } from '../../../../tools/option';
import { AccountVoterWeightRecord } from '../../../../hooks/governance-sdk';
import { PublicKey } from '@solana/web3.js';

const options = [
  { label: '15%', value: 1_500 },
  { label: '30%', value: 3_000 },
  { label: '100%', value: 10_000 },
];

export function CastVoteButton({
  proposal,
  governance,
  tokenOwnerRecord,
  voterWeightRecord,
  communityVoterWeightAddin,
  vote,
  voteRecord,
  hasVoteTimeExpired,
}: {
  proposal: ProgramAccount<Proposal>;
  governance: ProgramAccount<Governance>;
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>;
  voterWeightRecord?: AccountVoterWeightRecord;
  communityVoterWeightAddin?: PublicKey;
  vote: YesNoVote;
  voteRecord: Option<ProgramAccount<VoteRecord>> | undefined;
  hasVoteTimeExpired: boolean | undefined;
}) {
  const rpcContext = useRpcContext();
  const [votePercentage, setVotePercentage] = useState(options[0].value)

  const canVote =
    !tokenOwnerRecord?.account.governingTokenDepositAmount.isZero()
    || (voterWeightRecord && voterWeightRecord.voterWeight.account.voterWeight.toNumber() > 0);

  const isVisible =
    hasVoteTimeExpired === false &&
    voteRecord?.isNone() &&
    canVote &&
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

  if (!isVisible) return null

  return (
    <Button
      type="primary"
      icon={icon}
      onClick={() =>
        Modal.confirm({
          title,
          icon,
          content: (
            <Row>
              <Col span={24}>
                <p>{msg}</p>
                {vote === YesNoVote.Yes ? <Radio.Group
                  options={options}
                  value={votePercentage}
                  onChange={(ev) => {
                    setVotePercentage(ev.target.value)
                  }}
                  optionType="button"
                  buttonStyle="solid"
                /> : null}
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
              votePercentage,
              voterWeightRecord?.voterWeight.pubkey,
              voterWeightRecord?.maxVoterWeight.pubkey,
              communityVoterWeightAddin,
            );
          },
        })
      }
    >
      {btnLabel}
    </Button>
  );
}

import { Button, Col, Modal, Row, Radio, InputNumber } from 'antd';
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
  Realm,
} from '@solana/spl-governance';

import { castVote } from '../../../../actions/castVote';

import { useRpcContext } from '../../../../hooks/useRpcContext';
import { Option } from '../../../../tools/option';
import { AccountVoterWeightRecord } from '../../../../hooks/governance-sdk';
import { PublicKey } from '@solana/web3.js';

const options = [
  { label: '25%', value: 2_500 },
  { label: '50%', value: 5_000 },
  { label: '75%', value: 7_500 },
  { label: '100%', value: 10_000 },
];

export function CastVoteButton({
  realm,
  proposal,
  governance,
  tokenOwnerRecord,
  voterWeightRecord,
  communityVoterWeightAddin,
  vote,
  voteRecord,
  hasVoteTimeExpired,
}: {
  realm: ProgramAccount<Realm>;
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
  const [isModalVisible, setIsModalVisible] = useState(false);

  const canVote =
    !tokenOwnerRecord?.account.governingTokenDepositAmount.isZero()
    || (voterWeightRecord && !voterWeightRecord.voterWeight?.account.voterWeight.isZero());

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
    <>
      <Modal
        visible={isModalVisible}
        title={title}
        cancelText={LABELS.CANCEL}
        onCancel={() => setIsModalVisible(false)}
        okText={LABELS.CONFIRM}
        onOk={() => {
          castVote(
            {
              rpcContext,
              governance,
              realm,
              proposal,
              tokenOwnerRecord: tokenOwnerRecord.pubkey,
              vote,
              votePercentage,
              voterWeightRecord: voterWeightRecord?.voterWeight?.pubkey,
              maxVoterWeightRecord: voterWeightRecord?.maxVoterWeight?.pubkey,
              communityVoterWeightAddin,
            });
          setIsModalVisible(false);
        }}>
        <Row>
          <Col span={24}>
            <p>{msg}</p>
            <>
              <Radio.Group
                options={options}
                value={votePercentage}
                onChange={(ev) => {
                  setVotePercentage(ev.target.value)
                }}
                optionType="button"
                buttonStyle="solid"
              /><br /><br />
              Custom voter weight: <InputNumber
                defaultValue={0}
                min={0}
                max={100}
                formatter={value => `${value}%`}
                parser={(value: any) => value.replace('%', '')}
                onChange={(value) => setVotePercentage(Number(value) * 100)}
              />
            </>
          </Col>
        </Row>
      </Modal>
      <Button
        type="primary"
        icon={icon}
        onClick={() => setIsModalVisible(true)}
      >
        {btnLabel}
      </Button>
    </>
  );
}

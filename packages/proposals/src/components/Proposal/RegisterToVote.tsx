import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row, Slider } from 'antd';
import React, { useState } from 'react';
import {
  TimelockConfig,
  TimelockSet,
  TimelockStateStatus,
  VotingEntryRule,
} from '../../models/timelock';
import { LABELS } from '../../constants';
import { depositGovernanceTokens } from '../../actions/depositGovernanceTokens';
import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function RegisterToVote({
  proposal,
  timelockConfig,
}: {
  proposal: ParsedAccount<TimelockSet>;
  timelockConfig: ParsedAccount<TimelockConfig>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const voteAccount = useAccountByMint(proposal.info.votingMint);
  const yesVoteAccount = useAccountByMint(proposal.info.yesVotingMint);
  const noVoteAccount = useAccountByMint(proposal.info.noVotingMint);
  console.log(
    'My vote account',
    voteAccount?.info.amount.toNumber(),
    yesVoteAccount?.info.amount.toNumber(),
    noVoteAccount?.info.amount.toNumber(),
  );
  const governanceAccount = useAccountByMint(
    timelockConfig.info.governanceMint,
  );
  const alreadyHaveTokens =
    (voteAccount && voteAccount.info.amount.toNumber() > 0) ||
    (yesVoteAccount && yesVoteAccount.info.amount.toNumber() > 0) ||
    (noVoteAccount && noVoteAccount.info.amount.toNumber() > 0);

  const eligibleToView =
    (timelockConfig.info.votingEntryRule == VotingEntryRule.DraftOnly &&
      proposal.info.state.status == TimelockStateStatus.Draft) ||
    timelockConfig.info.votingEntryRule == VotingEntryRule.Anytime;
  const [_, setTokenAmount] = useState(1);
  return eligibleToView ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: 'Confirm',
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>
                  You can convert up to{' '}
                  {governanceAccount?.info.amount.toNumber() || 0} tokens to
                  voting tokens to vote on this proposal. You can refund these
                  at any time.
                </p>
                {governanceAccount?.info.amount.toNumber() && (
                  <Slider
                    min={1}
                    max={governanceAccount?.info.amount.toNumber() || 0}
                    onChange={setTokenAmount}
                  />
                )}
              </Col>
            </Row>
          ),
          okText: LABELS.CONFIRM,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (governanceAccount) {
              // tokenAmount is out of date in this scope, so we use a trick to get it here.
              const valueHolder = { value: 0 };
              await setTokenAmount(amount => {
                valueHolder.value = amount;
                return amount;
              });

              await depositGovernanceTokens(
                connection,
                wallet.wallet,
                proposal,
                voteAccount?.pubkey,
                yesVoteAccount?.pubkey,
                noVoteAccount?.pubkey,
                governanceAccount.pubkey,
                valueHolder.value,
              );
              // reset
              setTokenAmount(1);
            }
          },
        })
      }
    >
      {alreadyHaveTokens ? LABELS.ADD_MORE_VOTES : LABELS.REGISTER_TO_VOTE}
    </Button>
  ) : null;
}

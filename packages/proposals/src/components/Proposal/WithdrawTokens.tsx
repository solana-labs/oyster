import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row, Slider } from 'antd';
import React, { useState } from 'react';
import {
  TimelockConfig,
  TimelockSet,
  TimelockState,
  TimelockStateStatus,
} from '../../models/timelock';
import { LABELS } from '../../constants';
import { withdrawVotingTokens } from '../../actions/withdrawVotingTokens';
import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function WithdrawTokens({
  proposal,
  timelockConfig,
  state,
}: {
  proposal: ParsedAccount<TimelockSet>;
  state: ParsedAccount<TimelockState>;
  timelockConfig: ParsedAccount<TimelockConfig>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const voteAccount = useAccountByMint(proposal.info.votingMint);
  const yesVoteAccount = useAccountByMint(proposal.info.yesVotingMint);
  const noVoteAccount = useAccountByMint(proposal.info.noVotingMint);

  const governanceAccount = useAccountByMint(
    timelockConfig.info.governanceMint,
  );
  const votingTokens = (voteAccount && voteAccount.info.amount.toNumber()) || 0;
  let totalTokens = votingTokens;
  const inEscrow =
    ((yesVoteAccount && yesVoteAccount.info.amount.toNumber()) || 0) +
    ((noVoteAccount && noVoteAccount.info.amount.toNumber()) || 0);
  let additionalMsg = '';
  if (state.info.status !== TimelockStateStatus.Voting) {
    totalTokens += inEscrow;
  } else additionalMsg = LABELS.ADDITIONAL_VOTING_MSG;

  const [_, setTokenAmount] = useState(1);
  return votingTokens + inEscrow > 0 ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: 'Confirm',
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>You can withdraw up to {totalTokens} voting tokens. </p>
                {additionalMsg && <p>{additionalMsg}</p>}
                {additionalMsg && (
                  <p>
                    You have {inEscrow} tokens in holding until voting
                    completes.
                  </p>
                )}
                <Slider min={1} max={totalTokens} onChange={setTokenAmount} />
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

              await withdrawVotingTokens(
                connection,
                wallet.wallet,
                proposal,
                state,
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
      {LABELS.REFUND_TOKENS}
    </Button>
  ) : null;
}

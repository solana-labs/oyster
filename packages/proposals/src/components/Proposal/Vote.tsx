import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row, Slider } from 'antd';
import React, { useState } from 'react';
import { TimelockSet } from '../../models/timelock';
import { LABELS } from '../../constants';
import { vote } from '../../actions/vote';
import { utils, contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function Vote({ proposal }: { proposal: ParsedAccount<TimelockSet> }) {
  const wallet = useWallet();
  const connection = useConnection();
  const voteAccount = useAccountByMint(proposal.info.votingMint);
  const [tokenAmount, setTokenAmount] = useState(1);
  return (
    <Button
      type="primary"
      disabled={!voteAccount}
      onClick={() =>
        confirm({
          title: 'Confirm',
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>
                  Burning your {voteAccount?.info.amount.toNumber()} tokens is
                  an irreversible action and indicates support for this
                  proposal. Choose how many to burn in favor of this proposal.
                </p>
                <Slider
                  min={1}
                  max={voteAccount?.info.amount.toNumber()}
                  onChange={setTokenAmount}
                />
              </Col>
            </Row>
          ),
          okText: 'Confirm',
          cancelText: 'Cancel',
          onOk: async () => {
            if (voteAccount) {
              // tokenAmount is out of date in this scope, so we use a trick to get it here.
              const valueHolder = { value: 0 };
              await setTokenAmount(amount => {
                valueHolder.value = amount;
                return amount;
              });

              await vote(
                connection,
                wallet.wallet,
                proposal,
                voteAccount.pubkey,
                valueHolder.value,
              );
              // reset
              setTokenAmount(1);
            }
          },
        })
      }
    >
      {LABELS.VOTE}
    </Button>
  );
}

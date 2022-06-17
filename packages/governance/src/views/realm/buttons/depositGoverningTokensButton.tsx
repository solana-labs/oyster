import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '@solana/spl-governance';
import { LABELS } from '../../../constants';
import { hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { depositGoverningTokens } from '../../../actions/depositGoverningTokens';
import { PublicKey } from '@solana/web3.js';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { ProgramAccount } from '@solana/spl-governance';
import BN from 'bn.js';

const { useAccountByMint } = hooks;

const { confirm } = Modal;

export function DepositGoverningTokensButton({
  realm,
  governingTokenMint,
  tokenName,
}: {
  realm: ProgramAccount<Realm> | undefined;
  governingTokenMint: PublicKey | undefined;
  tokenName?: string;
}) {
  const rpcContext = useRpcContext();

  const governingTokenAccount = useAccountByMint(governingTokenMint);

  if (!realm) {
    return null;
  }

  const isVisible = true;

  const actionButton = isVisible ? (
    <Button
      type="primary"
      onClick={() =>
        confirm({
          title: LABELS.DEPOSIT_TOKENS,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{LABELS.DEPOSIT_TOKENS_QUESTION}</p>
              </Col>
            </Row>
          ),
          okText: LABELS.DEPOSIT,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (governingTokenAccount) {
              // todo: implement UI element for entering amount
              const amount = new BN(10000);
              //full amount: governingTokenSource.info.amount;

              await depositGoverningTokens(
                rpcContext,
                realm!.pubkey,
                governingTokenAccount,
                governingTokenMint!,
                amount,
              );
            }
          },
        })
      }
    >
      {LABELS.DEPOSIT_TOKENS(tokenName)}
    </Button>
  ) : null;

  return <>
    {governingTokenAccount &&
      <span>Balance: {
        governingTokenAccount?.info.amount.toString() || 'null'
      }</span>
    }
    {actionButton}
  </>;
}

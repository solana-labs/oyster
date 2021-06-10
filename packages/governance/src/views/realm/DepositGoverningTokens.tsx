import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '../../models/accounts';
import { LABELS } from '../../constants';
import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { depositGoverningTokens } from '../../actions/depositGoverningTokens';
import { PublicKey } from '@solana/web3.js';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function DepositGoverningTokens({
  realm,
  governingTokenMint,
  tokenName,
}: {
  realm: ParsedAccount<Realm> | undefined;
  governingTokenMint: PublicKey | undefined;
  tokenName?: string;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const governingTokenAccount = useAccountByMint(governingTokenMint);

  if (!realm) {
    return null;
  }

  const isVisible =
    realm != null &&
    governingTokenAccount &&
    governingTokenAccount.info.amount.toNumber() > 0;

  return isVisible ? (
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
              await depositGoverningTokens(
                connection,
                realm!.pubkey,
                governingTokenAccount,
                governingTokenMint!,
                wallet.wallet,
              );
            }
          },
        })
      }
    >
      {LABELS.DEPOSIT_TOKENS(tokenName)}
    </Button>
  ) : null;
}

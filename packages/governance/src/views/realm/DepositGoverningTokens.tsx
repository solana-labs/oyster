import { ParsedAccount } from '@oyster/common';
import { Button, ButtonProps, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '../../models/accounts';
import { LABELS } from '../../constants';
import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { depositGoverningTokens } from '../../actions/depositGoverningTokens';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function DepositGoverningTokens({
  realm,
  buttonProps,
}: {
  realm: ParsedAccount<Realm> | null;
  buttonProps: ButtonProps;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const governingTokenAccount = useAccountByMint(realm?.info.communityMint);

  if (!realm) {
    return null;
  }

  const isVisible =
    realm != null &&
    governingTokenAccount &&
    governingTokenAccount.info.amount.toNumber() > 0;

  const governingTokenMint = realm!.info.communityMint;

  return isVisible ? (
    <Button
      {...buttonProps}
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
                governingTokenMint,
                wallet.wallet,
              );
            }
          },
        })
      }
    >
      {LABELS.DEPOSIT_TOKENS}
    </Button>
  ) : null;
}

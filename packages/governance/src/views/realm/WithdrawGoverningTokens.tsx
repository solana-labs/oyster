import { ParsedAccount } from '@oyster/common';
import { Button, ButtonProps, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '../../models/governance';
import { LABELS } from '../../constants';
import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { withdrawGoverningTokens } from '../../actions/withdrawGoverningTokens';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function WithdrawGoverningTokens({
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

  const isVisible = realm != null && governingTokenAccount;

  const governingTokenMint = realm!.info.communityMint;

  return isVisible ? (
    <Button
      {...buttonProps}
      type="primary"
      onClick={() =>
        confirm({
          title: LABELS.WITHDRAW_TOKENS,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{LABELS.WITHDRAW_TOKENS_QUESTION}</p>
              </Col>
            </Row>
          ),
          okText: LABELS.WITHDRAW,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (governingTokenAccount) {
              await withdrawGoverningTokens(
                connection,
                realm!.pubkey,
                governingTokenAccount.pubkey,
                governingTokenMint,
                wallet.wallet,
              );
            }
          },
        })
      }
    >
      {LABELS.WITHDRAW_TOKENS}
    </Button>
  ) : null;
}

import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '../../models/accounts';
import { LABELS } from '../../constants';
import { contexts, hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { withdrawGoverningTokens } from '../../actions/withdrawGoverningTokens';
import { useWalletTokenOwnerRecord } from '../../contexts/GovernanceContext';
import { PublicKey } from '@solana/web3.js';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;

const { confirm } = Modal;
export function WithdrawGoverningTokens({
  realm,
  governingTokenMint,
  tokenName,
}: {
  realm?: ParsedAccount<Realm>;
  governingTokenMint?: PublicKey;
  tokenName?: string;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const governingTokenAccount = useAccountByMint(governingTokenMint);
  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    governingTokenMint,
  );

  if (!realm || !tokenOwnerRecord || !governingTokenMint) {
    return null;
  }

  const isVisible =
    tokenOwnerRecord.info.governingTokenDepositAmount.toNumber() > 0;

  return isVisible ? (
    <Button
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
      {LABELS.WITHDRAW_TOKENS(tokenName)}
    </Button>
  ) : null;
}

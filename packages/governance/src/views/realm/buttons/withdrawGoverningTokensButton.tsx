import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { Realm } from '../../../models/accounts';
import { LABELS } from '../../../constants';
import { hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { withdrawGoverningTokens } from '../../../actions/withdrawGoverningTokens';

import { PublicKey } from '@solana/web3.js';
import { useWalletTokenOwnerRecord } from '../../../hooks/apiHooks';
import { useRpcContext } from '../../../hooks/useRpcContext';

const { useAccountByMint } = hooks;

const { confirm, error } = Modal;
export function WithdrawGoverningTokensButton({
  realm,
  governingTokenMint,
  tokenName,
}: {
  realm?: ParsedAccount<Realm>;
  governingTokenMint?: PublicKey;
  tokenName?: string;
}) {
  const rpcContext = useRpcContext();
  const governingTokenAccount = useAccountByMint(governingTokenMint);
  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    governingTokenMint,
  );

  if (!realm || !tokenOwnerRecord || !governingTokenMint) {
    return null;
  }

  const isVisible =
    tokenOwnerRecord &&
    !tokenOwnerRecord.info.governingTokenDepositAmount.isZero();

  return isVisible ? (
    <Button
      type="ghost"
      onClick={() => {
        if (tokenOwnerRecord.info.unrelinquishedVotesCount > 0) {
          error({
            title: "Can't withdraw tokens",
            content: `You have tokens staked in ${tokenOwnerRecord.info.unrelinquishedVotesCount} proposal(s). Please release your tokens from the proposals before withdrawing the tokens from the realm.`,
          });
          return;
        }

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
                rpcContext,
                realm!.pubkey,
                governingTokenAccount.pubkey,
                governingTokenMint,
              );
            }
          },
        });
      }}
    >
      {LABELS.WITHDRAW_TOKENS(tokenName)}
    </Button>
  ) : null;
}

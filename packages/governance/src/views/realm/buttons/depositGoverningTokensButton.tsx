import { Button, Col, Modal, Row } from 'antd';
import React, { useMemo, useState } from 'react';
import { ProgramAccount, Realm } from '@solana/spl-governance';
import { LABELS } from '../../../constants';
import { hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  depositGoverningTokens,
} from '../../../actions/depositGoverningTokens';
import { PublicKey } from '@solana/web3.js';
import { useRpcContext } from '../../../hooks/useRpcContext';
import BN from 'bn.js';
import { useVoterWeightRecord } from '../../../hooks/apiHooks';
import { useVestingProgramId } from '../../../hooks/useVestingProgramId';

const { useAccountByMint } = hooks;

const { confirm } = Modal;

export function DepositGoverningTokensButton ({
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
  const vestingProgramId = useVestingProgramId(realm);
  const voterWeightRecord = useVoterWeightRecord(realm);

  const availableBalance = new BN(
    (governingTokenAccount?.info.amount as BN) || 0
  );
  const [depositableAmount] = useState<BN>(
    availableBalance.isZero()
      ? new BN(100_000) : availableBalance.divn(2500)
  );

  const depositConfirmation = useMemo(() => {
    const amountPercentage = availableBalance.isZero()
      ? 0 : (depositableAmount.muln(10000).div(availableBalance).toNumber() /
        100);

    return <div>
      <p>{LABELS.DEPOSIT_TOKENS_QUESTION}</p>
      <Row>
        <Col flex={1}>{LABELS.WALLET_BALANCE}:</Col>
        <Col flex={1} style={{ textAlign: 'right' }}>{availableBalance.toString()}</Col>
      </Row>
      <Row>
        <Col flex={1}>
          Amount to deposit:
        </Col>
        <Col flex={1} style={{ textAlign: 'right' }}>
          {depositableAmount.toString()}
          <br />
          ( {amountPercentage > 0.001
          ? amountPercentage.toFixed(2)
          : '< 0.001'}% of total )
        </Col>
      </Row>
    </div>;
  }, [availableBalance, depositableAmount]);

  if (!realm) {
    return null;
  }

  const isVisible = !availableBalance.isZero();

  return isVisible ? (
    <Button
      type="primary"
      onClick={() => {
        confirm({
          title: LABELS.DEPOSIT_TOKENS(tokenName),
          icon: <ExclamationCircleOutlined />,
          // Modal.confirm content not reactive, so we can't provide inputbox
          content: depositConfirmation,
          okText: LABELS.DEPOSIT,
          cancelText: LABELS.CANCEL,
          onOk: async() => {
            if (governingTokenAccount && voterWeightRecord) {
              await depositGoverningTokens(
                rpcContext,
                realm!.pubkey,
                governingTokenAccount,
                governingTokenMint!,
                depositableAmount,
                vestingProgramId,
                voterWeightRecord!.voterWeight.pubkey,
                voterWeightRecord!.maxVoterWeight.pubkey,
              );
            }
          },
        });
      }}
    >
      {LABELS.DEPOSIT_TOKENS(tokenName)}
    </Button>
  ) : null;
}

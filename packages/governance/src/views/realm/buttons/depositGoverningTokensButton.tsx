import { Button, Col, InputNumber, Modal, Row } from 'antd';
import React, { useState } from 'react';
import { createVoterWeightRecordByVestingAddin, ProgramAccount, Realm } from '@solana/spl-governance';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { hooks } from '@oyster/common';
import BN from 'bn.js';

import { LABELS } from '../../../constants';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { depositGoverningTokens } from '../../../actions/depositGoverningTokens';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { useVoterWeightRecord } from '../../../hooks/apiHooks';
import { useVestingProgramId } from '../../../hooks/useVestingProgramId';
import { useMintFormatter } from '../../../hooks/useMintFormatter';

const { useAccountByMint } = hooks;
const { confirm } = Modal;

export function DepositGoverningTokensButton({ realm, governingTokenMint, tokenName }: {
  realm: ProgramAccount<Realm> | undefined;
  governingTokenMint: PublicKey | undefined;
  tokenName?: string;
}) {
  const rpcContext = useRpcContext();
  const governingTokenAccount = useAccountByMint(governingTokenMint);
  const { closestNumber, formatValue, parseValue } = useMintFormatter(governingTokenMint) || {};
  const vestingProgramId = useVestingProgramId(realm);
  const { voterWeight, maxVoterWeight } = useVoterWeightRecord(realm);
  const [isConfirmationVisible, setConfirmationVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableBalance = new BN(governingTokenAccount?.info.amount as BN || 0);
  const defaultDepositableAmount = availableBalance.isZero()
    ? closestNumber(100_000) : closestNumber(availableBalance.divn(4));

  const [depositableAmount, setDepositableAmount] = useState<BN>(defaultDepositableAmount);

  const amountPercentage = availableBalance.isZero()
    ? 0 : (depositableAmount.muln(10_000).div(availableBalance).toNumber() /
      100);

  const isVisible = governingTokenAccount && !availableBalance.isZero();

  const onDepositGoverningTokens = async (): Promise<void> => {
    if (governingTokenAccount) {
      setLoading(true);
      try {
        let voterWeightRecord = voterWeight?.pubkey;
        const { walletPubkey } = rpcContext;
        const instructions: TransactionInstruction[] = [];
        if (!voterWeightRecord && vestingProgramId) {
          voterWeightRecord = await createVoterWeightRecordByVestingAddin(
            instructions,
            vestingProgramId,
            vestingProgramId,
            realm!.pubkey,
            governingTokenMint!,
            walletPubkey,
            walletPubkey
          );
        }
        await depositGoverningTokens(
          rpcContext,
          {
            realm: realm!.pubkey,
            voterWeightRecord,
            instructions,
            governingTokenSource: governingTokenAccount,
            vestingProgramId: vestingProgramId,
            governingTokenMint: governingTokenMint!,
            depositableAmount: depositableAmount,
            maxVoterWeightRecord: maxVoterWeight?.pubkey
          }
        );
        setConfirmationVisible(false);
      } catch (e) {
        // user rejected transaction, noop
        console.log(e);
      } finally {
        setLoading(false);
      }
    }
  };

  return !!realm && isVisible ? <>
    <div>
      <Button
        type='primary'
        onClick={() => setConfirmationVisible(true)}
        onAbort={() => {
          confirm({
            title: LABELS.DEPOSIT_TOKENS(tokenName),
            icon: <ExclamationCircleOutlined />,
            // Modal.confirm content not reactive, so we can't provide inputbox
            okText: LABELS.DEPOSIT,
            cancelText: LABELS.CANCEL
          });
        }}>
        {LABELS.DEPOSIT_TOKENS(tokenName)}
      </Button>
    </div>
    <Modal
      visible={isConfirmationVisible}
      title={LABELS.DEPOSIT_TOKENS(tokenName)}
      destroyOnClose
      cancelText={LABELS.CANCEL}
      onCancel={() => {
        setConfirmationVisible(false);
        // reset initial value
        setDepositableAmount(defaultDepositableAmount);
      }}
      okText={LABELS.DEPOSIT}
      onOk={onDepositGoverningTokens}
      confirmLoading={loading}>
      <p>{LABELS.DEPOSIT_TOKENS_QUESTION}</p>
      <Row>
        <Col flex={1}>{LABELS.WALLET_BALANCE}:</Col>
        <Col flex={1} style={{ textAlign: 'right' }}>{
          formatValue(availableBalance)
        }</Col>
      </Row>
      <Row>
        <Col flex={1}>
          Amount to deposit:
        </Col>
        <Col flex={1} style={{ textAlign: 'right' }}>
          <InputNumber<string>
            value={formatValue(depositableAmount, true)}
            min={'0'}
            max={formatValue(availableBalance, true)}
            onChange={(v) => setDepositableAmount(parseValue(v?.toString()))}
          />
          <br />
          ( {amountPercentage > 0.001
          ? amountPercentage.toFixed(2)
          : '< 0.001'}% of total )
        </Col>
      </Row>
    </Modal>
  </> : null;
}


import { ActionConfirmation, ConnectButton, contexts } from '@oyster/common';
import { Reserve } from '@solana/spl-token-lending';
import { PublicKey } from '@solana/web3.js';
import { Card, Slider } from 'antd';
import React, { useCallback, useState } from 'react';
import { depositReserveLiquidity } from '../../actions';
import { LABELS, marks } from '../../constants';
import { InputType, useSliderInput, useUserBalance } from '../../hooks';
import CollateralInput from '../CollateralInput';
import './style.less';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export const DepositInput = (props: {
  className?: string;
  reserve: Reserve;
  address: PublicKey;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const reserve = props.reserve;
  const address = props.address;

  const { accounts: sourceAccounts, balance, balanceLamports } = useUserBalance(
    reserve?.liquidity.mintPubkey,
  );

  const convert = useCallback(
    (val: string | number) => {
      if (typeof val === 'string') {
        return (parseFloat(val) / balance) * 100;
      } else {
        return (val * balance) / 100;
      }
    },
    [balance],
  );

  const { value, setValue, pct, setPct, type } = useSliderInput(convert);

  const onDeposit = useCallback(() => {
    setPendingTx(true);

    (async () => {
      try {
        await depositReserveLiquidity(
          connection,
          wallet,
          type === InputType.Percent
            ? (pct * balanceLamports) / 100
            : Math.ceil(balanceLamports * (parseFloat(value) / balance)),
          sourceAccounts[0],
          reserve,
          address,
        );

        setValue('');
        setShowConfirmation(true);
      } catch {
        // TODO:
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    connection,
    setValue,
    balanceLamports,
    balance,
    wallet,
    value,
    pct,
    type,
    reserve,
    sourceAccounts,
    address,
  ]);

  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  };

  return (
    <Card className={props.className} bodyStyle={bodyStyle}>
      {showConfirmation ? (
        <ActionConfirmation onClose={() => setShowConfirmation(false)} />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
          }}
        >
          <div className="deposit-input-title">{LABELS.DEPOSIT_QUESTION}</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}
          >
            <CollateralInput
              title="Amount"
              reserve={reserve}
              amount={parseFloat(value) || 0}
              onInputChange={(val: number | null) => {
                setValue(val?.toString() || '');
              }}
              disabled={true}
              hideBalance={true}
            />
          </div>

          <Slider marks={marks} value={pct} onChange={setPct} />

          <ConnectButton
            size="large"
            type="primary"
            onClick={onDeposit}
            loading={pendingTx}
            disabled={sourceAccounts.length === 0}
          >
            {LABELS.DEPOSIT_ACTION}
          </ConnectButton>
        </div>
      )}
    </Card>
  );
};

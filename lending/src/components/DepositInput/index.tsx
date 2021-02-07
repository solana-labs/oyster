import React, { useCallback, useState } from 'react';
import { InputType, useSliderInput, useUserBalance } from '../../hooks';
import { LendingReserve } from '../../models/lending';
import { Card, Slider } from 'antd';
import { useConnection } from '@packages/common/contexts/connection';
import { useWallet } from '@packages/common/contexts/wallet';
import { deposit } from '../../actions/deposit';
import { PublicKey } from '@solana/web3.js';
import './style.less';
import { ActionConfirmation } from './../ActionConfirmation';
import { LABELS, marks } from '../../constants';
import { ConnectButton } from '../ConnectButton';
import CollateralInput from '../CollateralInput';

export const DepositInput = (props: { className?: string; reserve: LendingReserve; address: PublicKey }) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const reserve = props.reserve;
  const address = props.address;

  const { accounts: fromAccounts, balance, balanceLamports } = useUserBalance(reserve?.liquidityMint);

  const convert = useCallback(
    (val: string | number) => {
      if (typeof val === 'string') {
        return (parseFloat(val) / balance) * 100;
      } else {
        return (val * balance) / 100;
      }
    },
    [balance]
  );

  const { value, setValue, pct, setPct, type } = useSliderInput(convert);

  const onDeposit = useCallback(() => {
    setPendingTx(true);

    (async () => {
      try {
        await deposit(
          fromAccounts[0],
          type === InputType.Percent
            ? (pct * balanceLamports) / 100
            : Math.ceil(balanceLamports * (parseFloat(value) / balance)),
          reserve,
          address,
          connection,
          wallet
        );

        setValue('');
        setShowConfirmation(true);
      } catch {
        // TODO:
      } finally {
        setPendingTx(false);
      }
    })();
  }, [connection, setValue, balanceLamports, balance, wallet, value, pct, type, reserve, fromAccounts, address]);

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
          <div className='deposit-input-title'>{LABELS.DEPOSIT_QUESTION}</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}
          >
            <CollateralInput
              title='Amount'
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
            size='large'
            type='primary'
            onClick={onDeposit}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {LABELS.DEPOSIT_ACTION}
          </ConnectButton>
        </div>
      )}
    </Card>
  );
};

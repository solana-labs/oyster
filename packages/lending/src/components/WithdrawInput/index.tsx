import { ActionConfirmation, ConnectButton, contexts } from '@oyster/common';
import { Reserve } from '@solana/spl-token-lending';
import { PublicKey } from '@solana/web3.js';
import { Card, Slider } from 'antd';
import React, { useCallback, useState } from 'react';
import { redeemReserveCollateral } from '../../actions';
import { LABELS, marks } from '../../constants';
import {
  InputType,
  useSliderInput,
  useUserBalance,
  useUserCollateralBalance,
} from '../../hooks';
import CollateralInput from '../CollateralInput';
import './style.less';

const { useConnection } = contexts.Connection;
const { useWallet } = contexts.Wallet;

export const WithdrawInput = (props: {
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

  const {
    balanceLamports: collateralBalanceLamports,
    accounts: sourceAccounts,
  } = useUserBalance(reserve?.collateral.mintPubkey);
  const { balance: collateralBalanceInLiquidity } = useUserCollateralBalance(
    reserve,
  );

  const convert = useCallback(
    (val: string | number) => {
      if (typeof val === 'string') {
        return (parseFloat(val) / collateralBalanceInLiquidity) * 100;
      } else {
        return (val * collateralBalanceInLiquidity) / 100;
      }
    },
    [collateralBalanceInLiquidity],
  );

  const { value, setValue, pct, setPct, type } = useSliderInput(convert);

  const onWithdraw = useCallback(() => {
    setPendingTx(true);

    (async () => {
      try {
        const collateralAmount = Math.min(
          type === InputType.Percent
            ? (pct * collateralBalanceLamports) / 100
            : Math.ceil(
                collateralBalanceLamports *
                  (parseFloat(value) / collateralBalanceInLiquidity),
              ),
          collateralBalanceLamports,
        );
        await redeemReserveCollateral(
          connection,
          wallet,
          collateralAmount,
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
    address,
    collateralBalanceInLiquidity,
    collateralBalanceLamports,
    connection,
    sourceAccounts,
    pct,
    reserve,
    setValue,
    type,
    value,
    wallet,
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
          <div className="withdraw-input-title">{LABELS.WITHDRAW_QUESTION}</div>
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
            onClick={onWithdraw}
            loading={pendingTx}
            disabled={sourceAccounts.length === 0}
          >
            {sourceAccounts.length === 0
              ? LABELS.NO_COLLATERAL
              : LABELS.WITHDRAW_ACTION}
          </ConnectButton>
        </div>
      )}
    </Card>
  );
};

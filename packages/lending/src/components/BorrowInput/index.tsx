import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useSliderInput,
  useUserBalance,
  useUserDeposits,
  useUserObligationByReserve,
} from '../../hooks';
import {
  BorrowAmountType,
  LendingReserve,
  LendingReserveParser,
} from '../../models';
import { Card } from 'antd';
import { contexts, ParsedAccount } from '@oyster/common';

import { borrow } from '../../actions';
import './style.less';
import { LABELS } from '../../constants';
import { ActionConfirmation } from './../ActionConfirmation';
import { BackButton } from './../BackButton';
import { ConnectButton } from '../ConnectButton';
import CollateralInput from '../CollateralInput';
import { useMidPriceInUSD } from '../../contexts/market';
import { RiskSlider } from '../RiskSlider';
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { cache } = contexts.Accounts;

export const BorrowInput = (props: {
  className?: string;
  reserve: ParsedAccount<LendingReserve>;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [collateralValue, setCollateralValue] = useState('');
  const [lastTyped, setLastTyped] = useState('collateral');
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const borrowReserve = props.reserve;

  const [collateralReserveKey, setCollateralReserveKey] = useState<string>();

  const collateralReserve = useMemo(() => {
    const id: string =
      cache
        .byParser(LendingReserveParser)
        .find(acc => acc === collateralReserveKey) || '';

    return cache.get(id) as ParsedAccount<LendingReserve>;
  }, [collateralReserveKey]);
  const borrowPrice = useMidPriceInUSD(
    borrowReserve.info.liquidityMint.toBase58(),
  ).price;
  const collateralPrice = useMidPriceInUSD(
    collateralReserve?.info.liquidityMint.toBase58(),
  )?.price;

  const include = useMemo(
    () => new Set([collateralReserve?.pubkey.toBase58()]),
    [collateralReserve],
  );

  const exclude = useMemo(() => new Set([]), []);

  const { userDeposits: accountBalance } = useUserDeposits(exclude, include);
  const tokenBalance = accountBalance[0]?.info.amount || 0;

  const convert = useCallback(
    (val: string | number) => {
      const minAmount = Math.min(tokenBalance, Infinity);
      if (typeof val === 'string') {
        return (parseFloat(val) / minAmount) * 100;
      } else {
        return (val * minAmount) / 100;
      }
    },
    [tokenBalance],
  );

  const { value, setValue, pct } = useSliderInput(convert);

  useEffect(() => {
    if (collateralReserve && lastTyped === 'collateral') {
      const ltv = borrowReserve.info.config.loanToValueRatio / 100;

      if (collateralValue) {
        const nCollateralValue = parseFloat(collateralValue);
        const borrowInUSD = nCollateralValue * collateralPrice * ltv;
        const borrowAmount = borrowInUSD / borrowPrice;
        setValue(borrowAmount.toString());
      } else {
        setValue('');
      }
    }
  }, [
    lastTyped,
    collateralReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    collateralValue,
    setValue,
  ]);

  useEffect(() => {
    if (collateralReserve && lastTyped === 'borrow') {
      const ltv = borrowReserve.info.config.loanToValueRatio / 100;

      if (value) {
        const nValue = parseFloat(value);
        const borrowInUSD = nValue * borrowPrice;
        const collateralAmount = borrowInUSD / ltv / collateralPrice;
        setCollateralValue(collateralAmount.toString());
      } else {
        setCollateralValue('');
      }
    }
  }, [
    lastTyped,
    collateralReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    value,
  ]);

  const { userObligationsByReserve } = useUserObligationByReserve(
    borrowReserve?.pubkey,
    collateralReserve?.pubkey,
  );
  const { accounts: fromAccounts } = useUserBalance(
    collateralReserve?.info.collateralMint,
  );
  const onBorrow = useCallback(() => {
    if (!collateralReserve) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        await borrow(
          connection,
          wallet,

          fromAccounts[0],
          parseFloat(value),
          // TODO: switch to collateral when user is using slider
          BorrowAmountType.LiquidityBorrowAmount,
          borrowReserve,
          collateralReserve,

          // TODO: select exsisting obligations by collateral reserve
          userObligationsByReserve.length > 0
            ? userObligationsByReserve[0].obligation.account
            : undefined,

          userObligationsByReserve.length > 0
            ? userObligationsByReserve[0].userAccounts[0].pubkey
            : undefined,
        );

        setValue('');
        setCollateralValue('');
        setShowConfirmation(true);
      } catch {
        // TODO:
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    connection,
    wallet,
    value,
    setValue,
    collateralReserve,
    borrowReserve,
    fromAccounts,
    userObligationsByReserve,
    setPendingTx,
    setShowConfirmation,
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
          <div className="borrow-input-title">{LABELS.BORROW_QUESTION}</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}
          >
            <CollateralInput
              title="Collateral (estimated)"
              reserve={borrowReserve.info}
              amount={parseFloat(collateralValue) || 0}
              onInputChange={(val: number | null) => {
                setCollateralValue(val?.toString() || '');
                setLastTyped('collateral');
              }}
              onCollateralReserve={key => {
                setCollateralReserveKey(key);
              }}
              useFirstReserve={true}
            />
          </div>
          <RiskSlider value={pct} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <CollateralInput
              title="Borrow Amount"
              reserve={borrowReserve.info}
              amount={parseFloat(value) || 0}
              onInputChange={(val: number | null) => {
                setValue(val?.toString() || '');
                setLastTyped('borrow');
              }}
              disabled={true}
              hideBalance={true}
            />
          </div>
          <ConnectButton
            size="large"
            type="primary"
            onClick={onBorrow}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {fromAccounts.length === 0
              ? LABELS.NO_COLLATERAL
              : LABELS.BORROW_ACTION}
          </ConnectButton>
          <BackButton />
        </div>
      )}
    </Card>
  );
};

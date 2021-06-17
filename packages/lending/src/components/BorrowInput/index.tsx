import {
  ActionConfirmation,
  BackButton,
  ConnectButton,
  contexts,
  ParsedAccount,
} from '@oyster/common';
import { Card } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { borrowObligationLiquidity } from '../../actions';
import { LABELS } from '../../constants';
import { usePrice } from '../../contexts/pyth';
import {
  useSliderInput,
  useUserBalance,
  useUserDeposits,
  useUserObligationByReserve,
} from '../../hooks';
import { Reserve, ReserveParser } from '../../models';
import CollateralInput from '../CollateralInput';
import { RiskSlider } from '../RiskSlider';
import './style.less';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { cache } = contexts.Accounts;

export const BorrowInput = (props: {
  className?: string;
  reserve: ParsedAccount<Reserve>;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [collateralValue, setCollateralValue] = useState('');
  const [lastTyped, setLastTyped] = useState('collateral');
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const borrowReserve = props.reserve;

  const [depositReserveKey, setCollateralReserveKey] = useState<string>();

  const depositReserve = useMemo(() => {
    const id: string =
      cache.byParser(ReserveParser).find(acc => acc === depositReserveKey) ||
      '';

    return cache.get(id) as ParsedAccount<Reserve>;
  }, [depositReserveKey]);
  const borrowPrice = usePrice(
    borrowReserve.info.liquidity.mintPubkey.toBase58(),
  );
  const collateralPrice = usePrice(
    depositReserve?.info.liquidity.mintPubkey.toBase58(),
  );

  const include = useMemo(() => new Set([depositReserve?.pubkey.toBase58()]), [
    depositReserve,
  ]);

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
    if (depositReserve && lastTyped === 'collateral') {
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
    depositReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    collateralValue,
    setValue,
  ]);

  useEffect(() => {
    if (depositReserve && lastTyped === 'borrow') {
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
    depositReserve,
    collateralPrice,
    borrowPrice,
    borrowReserve,
    value,
  ]);

  const { userObligationsByReserve } = useUserObligationByReserve(
    borrowReserve?.pubkey,
    depositReserve?.pubkey,
  );
  const { accounts: sourceAccounts } = useUserBalance(
    depositReserve?.info.collateral.mintPubkey,
  );
  const onBorrow = useCallback(() => {
    if (!depositReserve) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        await borrowObligationLiquidity(
          connection,
          wallet,
          parseFloat(value),
          borrowReserve,
          // TODO: select existing obligations by collateral reserve
          userObligationsByReserve[0].obligation.account
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
    depositReserve,
    borrowReserve,
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
            disabled={sourceAccounts.length === 0}
          >
            {sourceAccounts.length === 0
              ? LABELS.NO_COLLATERAL
              : LABELS.BORROW_ACTION}
          </ConnectButton>
          <BackButton />
        </div>
      )}
    </Card>
  );
};

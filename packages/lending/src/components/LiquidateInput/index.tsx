import { Slider } from 'antd';
import Card from 'antd/lib/card';
import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { LABELS, marks } from '../../constants';
import {
  ParsedAccount,
  contexts,
  utils,
  ConnectButton,
  ActionConfirmation,
} from '@oyster/common';
import {
  EnrichedLendingObligation,
  InputType,
  useSliderInput,
  useUserBalance,
} from '../../hooks';
import { LendingReserve } from '../../models';
import { liquidate } from '../../actions';
import './style.less';
import CollateralInput from '../CollateralInput';
import { useMidPriceInUSD } from '../../contexts/market';
import { useWallet } from '@solana/wallet-adapter-react';

const { notify, fromLamports, wadToLamports } = utils;
const { useConnection } = contexts.Connection;
const { useMint } = contexts.Accounts;

export const LiquidateInput = (props: {
  className?: string;
  repayReserve: ParsedAccount<LendingReserve>;
  withdrawReserve: ParsedAccount<LendingReserve>;
  obligation: EnrichedLendingObligation;
}) => {
  const connection = useConnection();
  const wallet = useWallet();
  const { repayReserve, withdrawReserve, obligation } = props;
  const [lastTyped, setLastTyped] = useState('liquidate');
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [collateralValue, setCollateralValue] = useState('');

  const liquidityMint = useMint(repayReserve.info.liquidityMint);
  const { accounts: fromAccounts, balance: tokenBalance } = useUserBalance(
    repayReserve?.info.liquidityMint,
  );
  const borrowAmountLamports = wadToLamports(
    obligation.info.borrowAmountWad,
  ).toNumber();

  const borrowAmount = fromLamports(borrowAmountLamports, liquidityMint);

  const convert = useCallback(
    (val: string | number) => {
      const minAmount = Math.min(tokenBalance || Infinity, borrowAmount);
      setLastTyped('liquidate');
      if (typeof val === 'string') {
        return (parseFloat(val) / minAmount) * 100;
      } else {
        return (val * minAmount) / 100;
      }
    },
    [borrowAmount, tokenBalance],
  );

  const { value, setValue, pct, setPct, type } = useSliderInput(convert);

  const onLiquidate = useCallback(() => {
    if (!withdrawReserve) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        const toLiquidateLamports =
          type === InputType.Percent && tokenBalance >= borrowAmount
            ? (pct * borrowAmountLamports) / 100
            : Math.ceil(
                borrowAmountLamports * (parseFloat(value) / borrowAmount),
              );
        await liquidate(
          connection,
          wallet,
          fromAccounts[0],
          // TODO: ensure user has available amount
          toLiquidateLamports,
          obligation.account,
          repayReserve,
          withdrawReserve,
        );

        setValue('');
        setCollateralValue('');
        setShowConfirmation(true);
      } catch (error) {
        // TODO:
        notify({
          message: 'Unable to liquidate loan.',
          type: 'error',
          description: error.message,
        });
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    withdrawReserve,
    fromAccounts,
    obligation,
    repayReserve,
    wallet,
    connection,
    value,
    setValue,
    borrowAmount,
    borrowAmountLamports,
    pct,
    tokenBalance,
    type,
  ]);

  const collateralPrice = useMidPriceInUSD(
    withdrawReserve?.info.liquidityMint.toBase58(),
  )?.price;

  useEffect(() => {
    if (withdrawReserve && lastTyped === 'liquidate') {
      const collateralInQuote = obligation.info.collateralInQuote;
      const collateral = collateralInQuote / collateralPrice;
      if (value) {
        const borrowRatio = (parseFloat(value) / borrowAmount) * 100;
        const collateralAmount = (borrowRatio * collateral) / 100;
        setCollateralValue(collateralAmount.toString());
      } else {
        setCollateralValue('');
      }
    }
  }, [
    borrowAmount,
    collateralPrice,
    withdrawReserve,
    lastTyped,
    obligation.info.collateralInQuote,
    value,
  ]);

  useEffect(() => {
    if (withdrawReserve && lastTyped === 'collateral') {
      const collateralInQuote = obligation.info.collateralInQuote;
      const collateral = collateralInQuote / collateralPrice;
      if (collateralValue) {
        const collateralRatio =
          (parseFloat(collateralValue) / collateral) * 100;
        const borrowValue = (collateralRatio * borrowAmount) / 100;
        setValue(borrowValue.toString());
      } else {
        setValue('');
      }
    }
  }, [
    borrowAmount,
    collateralPrice,
    withdrawReserve,
    collateralValue,
    lastTyped,
    obligation.info.collateralInQuote,
    setValue,
  ]);

  if (!withdrawReserve) return null;
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
          <div className="repay-input-title">{LABELS.LIQUIDATE_QUESTION}</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}
          >
            <CollateralInput
              title="Liquidate Amount"
              reserve={repayReserve.info}
              amount={parseFloat(value) || 0}
              onInputChange={(val: number | null) => {
                setValue(val?.toString() || '');
                setLastTyped('liquidate');
              }}
              disabled={true}
              useWalletBalance={true}
            />
          </div>
          <Slider marks={marks} value={pct} onChange={setPct} />
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
              title="Collateral Amount (estimated)"
              reserve={withdrawReserve?.info}
              amount={parseFloat(collateralValue) || 0}
              onInputChange={(val: number | null) => {
                setCollateralValue(val?.toString() || '');
                setLastTyped('collateral');
              }}
              disabled={true}
              hideBalance={true}
            />
          </div>
          <ConnectButton
            type="primary"
            size="large"
            onClick={onLiquidate}
            loading={pendingTx}
            disabled={fromAccounts.length === 0}
          >
            {LABELS.LIQUIDATE_ACTION}
          </ConnectButton>
        </div>
      )}
    </Card>
  );
};

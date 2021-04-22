import {
  ActionConfirmation,
  ConnectButton,
  contexts,
  fromLamports,
  hooks,
  notify,
  ParsedAccount,
  wadToLamports,
} from '@oyster/common';
import { Card, Slider } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { repayObligationLiquidity } from '../../actions';
import { LABELS, marks } from '../../constants';
import { useMidPriceInUSD } from '../../contexts/market';
import {
  EnrichedLendingObligation,
  InputType,
  useSliderInput,
  useUserBalance,
} from '../../hooks';
import { Reserve } from '../../models';
import CollateralInput from '../CollateralInput';
import './style.less';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useMint } = contexts.Accounts;
const { useAccountByMint } = hooks;

export const RepayInput = (props: {
  className?: string;
  borrowReserve: ParsedAccount<Reserve>;
  depositReserve: ParsedAccount<Reserve>;
  obligation: EnrichedLendingObligation;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [lastTyped, setLastTyped] = useState('repay');
  const [pendingTx, setPendingTx] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [collateralValue, setCollateralValue] = useState('');

  const repayReserve = props.borrowReserve;
  const obligation = props.obligation;

  const liquidityMint = useMint(repayReserve.info.liquidity.mint);
  const { balance: tokenBalance } = useUserBalance(
    repayReserve.info.liquidity.mint,
  );

  const borrowAmountLamports = wadToLamports(
    obligation.info.borrows[0].borrowedAmountWads,
  ).toNumber();
  const borrowAmount = fromLamports(borrowAmountLamports, liquidityMint);
  const depositReserve = props.depositReserve;

  const { accounts: sourceAccounts } = useUserBalance(
    repayReserve.info.liquidity.mint,
  );

  const convert = useCallback(
    (val: string | number) => {
      const minAmount = Math.min(tokenBalance || Infinity, borrowAmount);
      setLastTyped('repay');
      if (typeof val === 'string') {
        return (parseFloat(val) / minAmount) * 100;
      } else {
        return (val * minAmount) / 100;
      }
    },
    [borrowAmount, tokenBalance],
  );

  const { value, setValue, pct, setPct, type } = useSliderInput(convert);

  const onRepay = useCallback(() => {
    if (
      !depositReserve ||
      !obligation ||
      !repayReserve
    ) {
      return;
    }

    setPendingTx(true);

    (async () => {
      try {
        const toRepayLamports =
          type === InputType.Percent
            ? (pct * borrowAmountLamports) / 100
            : Math.ceil(
                borrowAmountLamports * (parseFloat(value) / borrowAmount),
              );
        await repayObligationLiquidity(
          connection,
          wallet,
          toRepayLamports,
          sourceAccounts[0],
          repayReserve,
          obligation.account,
        );

        setValue('');
        setCollateralValue('');
        setShowConfirmation(true);
      } catch (error) {
        notify({
          message: 'Unable to repay loan.',
          type: 'error',
          description: error.message,
        });
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    borrowAmount,
    borrowAmountLamports,
    depositReserve,
    connection,
    sourceAccounts,
    obligation,
    pct,
    repayReserve,
    setValue,
    type,
    value,
    wallet,
  ]);

  const collateralPrice = useMidPriceInUSD(
    depositReserve?.info.liquidity.mint.toBase58(),
  )?.price;

  useEffect(() => {
    if (depositReserve && lastTyped === 'repay') {
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
    depositReserve,
    lastTyped,
    obligation.info.collateralInQuote,
    value,
  ]);

  useEffect(() => {
    if (depositReserve && lastTyped === 'collateral') {
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
    depositReserve,
    collateralValue,
    lastTyped,
    obligation.info.collateralInQuote,
    setValue,
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
          <div className="repay-input-title">{LABELS.REPAY_QUESTION}</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}
          >
            <CollateralInput
              title="Repay Amount"
              reserve={repayReserve.info}
              amount={parseFloat(value) || 0}
              onInputChange={(val: number | null) => {
                setValue(val?.toString() || '');
                setLastTyped('repay');
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
              reserve={depositReserve?.info}
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
            onClick={onRepay}
            loading={pendingTx}
            disabled={sourceAccounts.length === 0}
          >
            {LABELS.REPAY_ACTION}
          </ConnectButton>
        </div>
      )}
    </Card>
  );
};

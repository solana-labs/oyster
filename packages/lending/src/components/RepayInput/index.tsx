import React, { useCallback, useEffect, useState } from 'react';
import {
  EnrichedLendingObligation,
  InputType,
  useSliderInput,
  useUserBalance,
} from '../../hooks';
import { LendingReserve } from '../../models';
import { Card, Slider } from 'antd';
import { ParsedAccount, contexts, utils, hooks, ConnectButton } from '@oyster/common';
import { repay } from '../../actions';
import './style.less';
import { LABELS, marks } from '../../constants';
import { ActionConfirmation } from './../ActionConfirmation';
import CollateralInput from '../CollateralInput';
import { useMidPriceInUSD } from '../../contexts/market';

const { notify, fromLamports, wadToLamports } = utils;
const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useMint } = contexts.Accounts;
const { useAccountByMint } = hooks;

export const RepayInput = (props: {
  className?: string;
  borrowReserve: ParsedAccount<LendingReserve>;
  collateralReserve: ParsedAccount<LendingReserve>;
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

  const liquidityMint = useMint(repayReserve.info.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(
    repayReserve.info.liquidityMint,
  );

  const borrowAmountLamports = wadToLamports(
    obligation.info.borrowAmountWad,
  ).toNumber();
  const borrowAmount = fromLamports(borrowAmountLamports, liquidityMint);
  const collateralReserve = props.collateralReserve;

  const { accounts: fromAccounts } = useUserBalance(
    repayReserve.info.liquidityMint,
  );

  const obligationAccount = useAccountByMint(obligation?.info.tokenMint);

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
      !collateralReserve ||
      !obligation ||
      !repayReserve ||
      !obligationAccount
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
        await repay(
          fromAccounts[0],
          toRepayLamports,
          obligation.account,
          obligationAccount,
          repayReserve,
          collateralReserve,
          connection,
          wallet,
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
    collateralReserve,
    connection,
    fromAccounts,
    obligation,
    obligationAccount,
    pct,
    repayReserve,
    setValue,
    type,
    value,
    wallet,
  ]);

  const collateralPrice = useMidPriceInUSD(
    collateralReserve?.info.liquidityMint.toBase58(),
  )?.price;

  useEffect(() => {
    if (collateralReserve && lastTyped === 'repay') {
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
    collateralReserve,
    lastTyped,
    obligation.info.collateralInQuote,
    value,
  ]);

  useEffect(() => {
    if (collateralReserve && lastTyped === 'collateral') {
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
    collateralReserve,
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
              reserve={collateralReserve?.info}
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
            disabled={fromAccounts.length === 0}
          >
            {LABELS.REPAY_ACTION}
          </ConnectButton>
        </div>
      )}
    </Card>
  );
};

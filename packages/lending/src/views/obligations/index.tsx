import { ConnectButton, contexts, useConnection } from '@oyster/common';
import React, { useCallback, useState } from 'react';
import { initObligation } from '../../actions';
import { LABELS } from '../../constants';
import {
  useLendingMarkets,
  useUserDeposits,
  useUserObligations,
} from './../../hooks';
import './style.less';

const { useWallet } = contexts.Wallet;

export const ObligationsView = () => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { userObligations } = useUserObligations();
  const { userDeposits } = useUserDeposits();
  const [pendingTx, setPendingTx] = useState(false);
  const { lendingMarkets } = useLendingMarkets();

  // @FIXME
  const lendingMarket = lendingMarkets[0]?.pubkey;

  const onInit = useCallback(() => {
    setPendingTx(true);

    (async () => {
      try {
        await initObligation(connection, wallet, lendingMarket);
      } catch {
        // TODO:
      } finally {
        setPendingTx(false);
      }
    })();
  }, [
    connection,
    wallet,
    lendingMarket,
    setPendingTx,
  ]);

  return <div className="obligations-container">
    <ConnectButton
      type="primary"
      size="large"
      onClick={onInit}
      loading={pendingTx}
    >
      {LABELS.INIT_OBLIGATION_ACTION}
    </ConnectButton>
  </div>;
};

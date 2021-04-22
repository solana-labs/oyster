import { contexts } from '@oyster/common';
import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { LendingProvider } from './contexts/lending';
import { MarketProvider } from './contexts/market';

import {
  BorrowReserveView,
  BorrowView,
  DashboardView,
  DepositReserveView,
  DepositView,
  FaucetView,
  HomeView,
  LiquidateReserveView,
  LiquidateView,
  MarginTrading,
  RepayReserveView,
  ReserveView,
  WithdrawView,
} from './views';
import { NewPosition } from './views/margin/newPosition';

const { WalletProvider } = contexts.Wallet;
const { ConnectionProvider } = contexts.Connection;
const { AccountsProvider } = contexts.Accounts;

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <ConnectionProvider>
          <WalletProvider>
            <AccountsProvider>
              <MarketProvider>
                <LendingProvider>
                  <AppLayout>
                    <Switch>
                      <Route exact path="/" component={() => <HomeView />} />
                      <Route
                        exact
                        path="/dashboard"
                        children={<DashboardView />}
                      />
                      <Route path="/reserve/:id" children={<ReserveView />} />
                      <Route
                        exact
                        path="/deposit"
                        component={() => <DepositView />}
                      />
                      <Route
                        path="/deposit/:id"
                        children={<DepositReserveView />}
                      />
                      <Route path="/withdraw/:id" children={<WithdrawView />} />
                      <Route exact path="/borrow" children={<BorrowView />} />
                      <Route
                        path="/borrow/:id"
                        children={<BorrowReserveView />}
                      />
                      <Route
                        path="/repay/loan/:obligation"
                        children={<RepayReserveView />}
                      />
                      <Route
                        path="/repay/:reserve"
                        children={<RepayReserveView />}
                      />
                      <Route
                        exact
                        path="/liquidate"
                        children={<LiquidateView />}
                      />
                      <Route
                        path="/liquidate/:id"
                        children={<LiquidateReserveView />}
                      />
                      <Route
                        exact
                        path="/margin"
                        children={<MarginTrading />}
                      />

                      <Route path="/margin/:id" children={<NewPosition />} />
                      <Route exact path="/faucet" children={<FaucetView />} />
                    </Switch>
                  </AppLayout>
                </LendingProvider>
              </MarketProvider>
            </AccountsProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

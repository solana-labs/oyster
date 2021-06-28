import { contexts } from '@oyster/common';
import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { LendingProvider } from './contexts/lending';
import { MarketProvider } from './contexts/market';
import { PythProvider } from './contexts/pyth';

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
              <PythProvider>
                <MarketProvider>
                  <LendingProvider>
                    <AppLayout>
                      <Switch>
                        <Route exact path="/" component={() => <HomeView />} />
                        <Route
                          exact
                          path="/dashboard"
                          component={() => <DashboardView />}
                        />
                        <Route path="/reserve/:id" component={() => <ReserveView />} />
                        <Route
                          exact
                          path="/deposit"
                          component={() => <DepositView />}
                        />
                        <Route
                          path="/deposit/:id"
                          component={() => <DepositReserveView />}
                        />
                        <Route path="/withdraw/:id" component={() => <WithdrawView />} />
                        <Route exact path="/borrow" component={() => <BorrowView />} />
                        <Route
                          path="/borrow/:id"
                          component={() => <BorrowReserveView />}
                        />
                        <Route
                          path="/repay/loan/:obligation"
                          component={() => <RepayReserveView />}
                        />
                        <Route
                          path="/repay/:reserve"
                          component={() => <RepayReserveView />}
                        />
                        <Route
                          exact
                          path="/liquidate"
                          component={() => <LiquidateView />}
                        />
                        <Route
                          path="/liquidate/:id"
                          component={() => <LiquidateReserveView />}
                        />
                        <Route
                          exact
                          path="/margin"
                          component={() => <MarginTrading />}
                        />

                        <Route path="/margin/:id" component={() => <NewPosition />} />
                        <Route exact path="/faucet" component={() => <FaucetView />} />
                      </Switch>
                    </AppLayout>
                  </LendingProvider>
                </MarketProvider>
              </PythProvider>
            </AccountsProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

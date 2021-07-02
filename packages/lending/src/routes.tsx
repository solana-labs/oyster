import { contexts } from '@oyster/common';
import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { LendingProvider } from './contexts/lending';
import { PythProvider } from './contexts/pyth';
import {
  FaucetView,
  HomeView,
  MarketsView,
  ObligationsView,
  ReservesView,
} from './views';

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
                <LendingProvider>
                  <AppLayout>
                    <Switch>
                      <Route exact path="/" component={() => <HomeView />} />
                      <Route
                        exact
                        path="/markets"
                        component={() => <MarketsView />}
                      />
                      <Route
                        exact
                        path="/reserves"
                        component={() => <ReservesView />}
                      />
                      <Route
                        exact
                        path="/obligations"
                        component={() => <ObligationsView />}
                      />
                      <Route
                        exact
                        path="/faucet"
                        component={() => <FaucetView />}
                      />
                    </Switch>
                  </AppLayout>
                </LendingProvider>
              </PythProvider>
            </AccountsProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

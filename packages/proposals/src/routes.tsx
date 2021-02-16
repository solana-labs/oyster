import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import { AppLayout } from './components/Layout';

import { DashboardView, HomeView } from './views';
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
              <AppLayout>
                <Switch>
                  <Route exact path="/" component={() => <HomeView />} />
                  <Route exact path="/dashboard" children={<DashboardView />} />
                </Switch>
              </AppLayout>
            </AccountsProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

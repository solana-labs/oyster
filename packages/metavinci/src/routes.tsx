import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import {
  MarketProvider,
  VinciAccountsProvider,
} from './contexts';
import { AppLayout } from './components/Layout';

import { HomeView } from './views';
import { UseWalletProvider } from 'use-wallet';
const { WalletProvider } = contexts.Wallet;
const { ConnectionProvider } = contexts.Connection;
const { AccountsProvider } = contexts.Accounts;

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <ConnectionProvider>
          <WalletProvider>
            <UseWalletProvider chainId={5}>
              <AccountsProvider>
                <MarketProvider>
                  <VinciAccountsProvider>
                    <AppLayout>
                      <Switch>
                        <Route
                          exact
                          path="/"
                          component={() => <HomeView />}
                        />
                        {/* <Route
                          exact
                          path="/faucet"
                          children={<FaucetView />}
                        /> */}
                      </Switch>
                    </AppLayout>
                  </VinciAccountsProvider>
                </MarketProvider>
              </AccountsProvider>
            </UseWalletProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

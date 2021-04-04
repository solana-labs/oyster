import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import {
  MarketProvider,
  VinciAccountsProvider,
} from './contexts';
import { AppLayout } from './components/Layout';

import { ArtCreateView, ArtistsView, ArtistView, ArtView, AuctionCreateView, AuctionView, HomeView, UserView } from './views';
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
                        <Route
                          exact
                          path="/art/create"
                          component={() => <ArtCreateView />}
                        />
                        <Route
                          exact
                          path="/user/:id"
                          component={() => <UserView />}
                        />
                        <Route
                          exact
                          path="/art/:id"
                          component={() => <ArtView />}
                        />
                        <Route
                          exact
                          path="/artist/:id"
                          component={() => <ArtistView />}
                        />
                        <Route
                          exact
                          path="/artists"
                          component={() => <ArtistsView />}
                        />
                        <Route
                          exact
                          path="/auction/:id"
                          component={() => <AuctionView />}
                        />
                        <Route
                          exact
                          path="/auction/create"
                          component={() => <AuctionCreateView />}
                        />
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

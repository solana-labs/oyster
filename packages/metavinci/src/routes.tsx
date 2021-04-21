import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { contexts } from '@oyster/common';
import {
  MarketProvider,
  MetaProvider,
} from './contexts';
import { AppLayout } from './components/Layout';

import { ArtCreateView, ArtistsView, ArtistView, ArtView, AuctionCreateView, AuctionView, HomeView, ArtworksView } from './views';
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
                  <MetaProvider>
                    <AppLayout>
                      <Switch>
                        <Route
                          exact
                          path="/art/create/:step_param?"
                          component={() => <ArtCreateView />}
                        />
                        <Route
                          exact
                          path="/user/:id?"
                          component={() => <ArtworksView />}
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
                          path="/auction/create/:step_param?"
                          component={() => <AuctionCreateView />}
                        />
                        <Route
                          exact
                          path="/auction/:id"
                          component={() => <AuctionView />}
                        />
                        <Route
                          path="/"
                          component={() => <HomeView />}
                        />
                      </Switch>
                    </AppLayout>
                  </MetaProvider>
                </MarketProvider>
              </AccountsProvider>
            </UseWalletProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

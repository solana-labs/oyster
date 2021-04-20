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
import { TorusProvider } from './contexts/torus';
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
                    <TorusProvider>
                      <AppLayout>
                        <Switch>
                          <Route
                            exact
                            path="/"
                            component={() => <HomeView />}
                          />
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
                        </Switch>
                      </AppLayout>
                    </TorusProvider>
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

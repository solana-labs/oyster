import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import { MarketProvider, TokenPairProvider, EthereumProvider } from './contexts';
import { AppLayout } from './components/Layout';

import {
  FaucetView,
  HomeView,
  TransferView,
} from './views';
import {CoingeckoProvider} from "./contexts/coingecko";
const { WalletProvider } = contexts.Wallet;
const { ConnectionProvider } = contexts.Connection;
const { AccountsProvider } = contexts.Accounts;

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <ConnectionProvider>
          <WalletProvider>
            <EthereumProvider>
              <AccountsProvider>
                <MarketProvider>
                  <CoingeckoProvider>
                    <TokenPairProvider>
                        <AppLayout>
                          <Switch>
                            <Route exact path="/" component={() => <HomeView />} />
                            <Route path="/move" children={<TransferView />} />
                            <Route exact path="/faucet" children={<FaucetView />} />
                          </Switch>
                        </AppLayout>
                    </TokenPairProvider>
                  </CoingeckoProvider>
                </MarketProvider>
              </AccountsProvider>
            </EthereumProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

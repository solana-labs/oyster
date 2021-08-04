import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import { MarketProvider, EthereumProvider } from './contexts';
import { AppLayout } from './components/Layout';

import {
  FaucetView,
  HomeView,
  TransferView,
  HelpView,
  ProofOfAssetsView,
  FaqView,
  RenbtcDebugView,
} from './views';
import { CoingeckoProvider } from './contexts/coingecko';
import { BridgeProvider } from './contexts/bridge';
import { UseWalletProvider } from 'use-wallet';
import { TokenChainPairProvider } from './contexts/chainPair';
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
              <EthereumProvider>
                <BridgeProvider>
                  <AccountsProvider>
                    <MarketProvider>
                      <CoingeckoProvider>
                        <TokenChainPairProvider>
                          <AppLayout>
                            <Switch>
                              <Route
                                exact
                                path="/"
                                component={() => <HomeView />}
                              />
                              <Route path="/move" children={<TransferView />} />
                              {/*<Route path="/faq" children={<FaqView />} />*/}
                              <Route
                                path="/proof-of-assets"
                                children={<ProofOfAssetsView />}
                              />
                              <Route path="/help" children={<HelpView />} />
                              <Route
                                exact
                                path="/faucet"
                                children={<FaucetView />}
                              />
                              <Route
                                exact
                                path="/debug-renbtc"
                                children={<RenbtcDebugView />}
                              />
                            </Switch>
                          </AppLayout>
                        </TokenChainPairProvider>
                      </CoingeckoProvider>
                    </MarketProvider>
                  </AccountsProvider>
                </BridgeProvider>
              </EthereumProvider>
            </UseWalletProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

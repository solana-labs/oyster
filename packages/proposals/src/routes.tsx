import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import { AppLayout } from './components/Layout';
import ProposalsProvider from './contexts/proposals';
import { DashboardView, HomeView } from './views';
import { ProposalView } from './views/proposal';
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
              <ProposalsProvider>
                <AppLayout>
                  <Switch>
                    <Route exact path="/" component={() => <HomeView />} />
                    <Route path="/proposal/:id" children={<ProposalView />} />

                    <Route
                      exact
                      path="/dashboard"
                      children={<DashboardView />}
                    />
                  </Switch>
                </AppLayout>
              </ProposalsProvider>
            </AccountsProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import { AppLayout } from './components/Layout/layout';
import GovernanceProvider from './contexts/GovernanceContext';
import { HomeView } from './views';
import { ProposalView } from './views/proposal/ProposalView';
import { GovernanceView } from './views/governance/GovernanceView';
import { DevToolsView } from './views/devtools/DevToolsView';
import { RealmView } from './views/realm/RealmView';
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
              <GovernanceProvider>
                <AppLayout>
                  <Switch>
                    <Route exact path="/" component={() => <HomeView />} />
                    <Route path="/proposal/:key" children={<ProposalView />} />
                    <Route
                      path="/governance/:key"
                      children={<GovernanceView />}
                    />
                    <Route path="/realm/:key" children={<RealmView />} />

                    <Route exact path="/devtools" children={<DevToolsView />} />
                  </Switch>
                </AppLayout>
              </GovernanceProvider>
            </AccountsProvider>
          </WalletProvider>
        </ConnectionProvider>
      </HashRouter>
    </>
  );
}

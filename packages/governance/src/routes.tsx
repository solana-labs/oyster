import { HashRouter, Route, Switch } from 'react-router-dom';
import React from 'react';
import { contexts } from '@oyster/common';
import { AppLayout } from './components/Layout/layout';
import GovernanceProvider from './contexts/GovernanceContext';
import { HomeView } from './views';
import { ProposalView } from './views/proposal/proposalView';
import { GovernanceView } from './views/governance/GovernanceView';
import { DevToolsView } from './views/devtools/DevToolsView';
import { RealmView } from './views/realm/realmView';

import { ErrorBoundary } from 'react-error-boundary';

import { AppErrorBanner } from './components/appErrorBanner/appErrorBanner';

const { WalletProvider } = contexts.Wallet;
const { ConnectionProvider } = contexts.Connection;
const { AccountsProvider } = contexts.Accounts;

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        {/* TODO: Adding the error boundary as a quick fix to avoid black screens
        for crashes However we should make it nicer and hide the technical
        details from users by default */}
        <ErrorBoundary FallbackComponent={AppErrorBanner}>
          <ConnectionProvider>
            <WalletProvider>
              <AccountsProvider>
                <GovernanceProvider>
                  <AppLayout>
                    <Switch>
                      <Route exact path="/" component={() => <HomeView />} />
                      <Route
                        path="/proposal/:key"
                        children={<ProposalView />}
                      />
                      <Route
                        path="/governance/:key"
                        children={<GovernanceView />}
                      />
                      <Route path="/realm/:key" children={<RealmView />} />

                      <Route
                        exact
                        path="/devtools"
                        children={<DevToolsView />}
                      />
                    </Switch>
                  </AppLayout>
                </GovernanceProvider>
              </AccountsProvider>
            </WalletProvider>
          </ConnectionProvider>
        </ErrorBoundary>
      </HashRouter>
    </>
  );
}

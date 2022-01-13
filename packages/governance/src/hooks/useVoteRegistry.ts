import { useConnectionConfig, useConnection, useWallet } from '@oyster/common';
import { useEffect, useState } from 'react';

import { useProgramInfo } from '../contexts/GovernanceContext';
import { Provider, Wallet } from '@project-serum/anchor';
import { VsrClient } from '@blockworks-foundation/voter-stake-registry-client';

export function useVoteRegistry() {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const wallet = useWallet();
  const { programId, programVersion } = useProgramInfo();
  const [client, setClient] = useState<VsrClient>();

  useEffect(
    () => {
      const handleSetClient = async () => {
        const options = Provider.defaultOptions();
        const provider = new Provider(
          connection,
          wallet as unknown as Wallet,
          options,
        );
        const vsrClient = await VsrClient.connect(provider, true);
        setClient(vsrClient);
      };
      if (wallet.connected) {
        handleSetClient();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, connection, wallet, endpoint, programVersion],
  );

  return client;
}
